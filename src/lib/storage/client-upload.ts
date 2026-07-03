import type { BookUploadPlan } from "@/lib/storage";
import { createClient } from "@/lib/supabase/client";

type UploadKind = "pdf" | "cover";

type UploadContext = {
  bookId: string;
  pdfPath: string;
  coverPath: string;
  coverContentType: string;
};

let cachedPlanKey: string | null = null;
let cachedPlan: BookUploadPlan | null = null;

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

async function ensureUploadPlan(context: UploadContext): Promise<BookUploadPlan> {
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
    throw new Error(await readJsonError(response, "Could not prepare upload."));
  }

  const plan = (await response.json()) as BookUploadPlan;
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

async function uploadViaR2Presigned(
  file: Blob | File,
  url: string,
  contentType: string,
) {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: file,
    });
  } catch {
    throw new Error(
      "Could not reach Cloudflare R2. Check your connection and CORS settings.",
    );
  }

  if (!response.ok) {
    throw new Error(`R2 upload failed (${response.status}).`);
  }
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
    throw new Error(error.message);
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
    throw new Error(await readJsonError(response, "File upload failed."));
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
    try {
      await uploadViaR2Presigned(file, url, contentType);
    } catch (error) {
      const message = error instanceof Error ? error.message : "File upload failed.";
      if (
        message.includes("Failed to fetch") ||
        message.includes("NetworkError") ||
        message.includes("CORS")
      ) {
        await uploadViaAppServer(file, path, kind, contentType);
        return;
      }
      throw error;
    }
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
    throw error;
  }
}
