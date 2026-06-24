import { createClient } from "@/lib/supabase/client";

type UploadKind = "pdf" | "cover";

type UploadContext = {
  bookId: string;
  pdfPath: string;
  coverPath: string;
  coverContentType: string;
};

type UploadPlan =
  | { storage: "supabase" }
  | {
      storage: "r2";
      pdfUploadUrl: string;
      coverUploadUrl: string;
    };

let cachedPlanKey: string | null = null;
let cachedPlan: UploadPlan | null = null;

export function resetUploadPlan() {
  cachedPlanKey = null;
  cachedPlan = null;
}

async function readJsonError(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error ?? fallback;
  } catch {
    return fallback;
  }
}

function normalizeUploadErrorMessage(message: string) {
  const lower = message.toLowerCase();

  if (lower.includes("bucket not found")) {
    return "Storage is not fully set up yet. Create the Supabase storage buckets `book-pdfs` and `book-covers`, or rerun the SQL setup.";
  }

  if (lower.includes("row-level security") || lower.includes("permission denied")) {
    return "Storage permissions are not ready yet. Recheck the Supabase storage policies from the setup SQL.";
  }

  return message;
}

async function ensureUploadPlan(context: UploadContext): Promise<UploadPlan> {
  const key = `${context.bookId}:${context.pdfPath}:${context.coverPath}`;
  if (cachedPlanKey === key && cachedPlan) return cachedPlan;

  let response: Response;
  try {
    response = await fetch("/api/books/upload-urls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(context),
    });
  } catch {
    throw new Error(
      "Could not reach the upload server. Check your connection and try again.",
    );
  }

  if (!response.ok) {
    throw new Error(
      normalizeUploadErrorMessage(
        await readJsonError(response, "Could not prepare upload."),
      ),
    );
  }

  const plan = (await response.json()) as UploadPlan;
  cachedPlanKey = key;
  cachedPlan = plan;
  return plan;
}

function toUploadBody(
  file: Blob | File,
  kind: UploadKind,
  contentType: string,
): Blob {
  if (file instanceof File && file.name) return file;
  const name = kind === "pdf" ? "book.pdf" : "cover.jpg";
  return new File([file], name, {
    type: contentType || file.type || "application/octet-stream",
  });
}

async function uploadViaSupabaseStorage(
  file: Blob | File,
  path: string,
  kind: UploadKind,
  contentType: string,
) {
  const supabase = createClient();
  const bucket = kind === "pdf" ? "book-pdfs" : "book-covers";
  const body = toUploadBody(file, kind, contentType);
  const { error } = await supabase.storage.from(bucket).upload(path, body, {
    contentType,
    upsert: true,
  });

  if (error) {
    throw new Error(normalizeUploadErrorMessage(error.message));
  }
}

async function uploadViaPresignedUrl(
  url: string,
  file: Blob | File,
  kind: UploadKind,
  contentType: string,
) {
  const body = toUploadBody(file, kind, contentType);
  let response: Response;
  try {
    response = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body,
    });
  } catch {
    throw new Error(
      "Could not reach storage. Check your connection and try again.",
    );
  }

  if (!response.ok) {
    throw new Error(`File upload failed (${response.status}).`);
  }
}

async function uploadViaAppServer(
  file: Blob | File,
  path: string,
  kind: UploadKind,
  contentType: string,
) {
  const uploadFile = toUploadBody(file, kind, contentType);
  const formData = new FormData();
  formData.append("file", uploadFile);
  formData.append("path", path);
  formData.append("kind", kind);
  formData.append("contentType", contentType);

  let response: Response;
  try {
    response = await fetch("/api/books/upload-file", {
      method: "POST",
      credentials: "same-origin",
      body: formData,
    });
  } catch {
    throw new Error(
      "Could not reach the upload server. Check your connection and try again.",
    );
  }

  if (!response.ok) {
    throw new Error(
      normalizeUploadErrorMessage(
        await readJsonError(response, "File upload failed."),
      ),
    );
  }
}

export async function uploadBookFileViaApi(
  file: Blob | File,
  path: string,
  kind: UploadKind,
  contentType: string,
  context: UploadContext,
) {
  const plan = await ensureUploadPlan(context);

  if (plan.storage === "r2") {
    const url = kind === "pdf" ? plan.pdfUploadUrl : plan.coverUploadUrl;
    await uploadViaPresignedUrl(url, file, kind, contentType);
    return;
  }

  try {
    await uploadViaSupabaseStorage(file, path, kind, contentType);
  } catch (error) {
    const message = error instanceof Error ? error.message : "File upload failed.";
    if (
      message.includes("Load failed") ||
      message.includes("Failed to fetch") ||
      message.includes("NetworkError")
    ) {
      await uploadViaAppServer(file, path, kind, contentType);
      return;
    }
    throw new Error(normalizeUploadErrorMessage(message));
  }
}
