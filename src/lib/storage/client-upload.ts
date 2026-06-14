import { createClient } from "@/lib/supabase/client";

type UploadKind = "pdf" | "cover";

type UploadPlan =
  | { storage: "supabase" }
  | { storage: "r2"; pdfUploadUrl: string; coverUploadUrl: string };

type UploadContext = {
  bookId: string;
  pdfPath: string;
  coverPath: string;
  coverContentType: string;
};

let cachedPlan: UploadPlan | null = null;
let cachedPlanKey: string | null = null;

export function resetUploadPlan() {
  cachedPlan = null;
  cachedPlanKey = null;
}

async function getUploadPlan(context: UploadContext): Promise<UploadPlan> {
  const key = `${context.bookId}:${context.pdfPath}:${context.coverPath}`;
  if (cachedPlan && cachedPlanKey === key) {
    return cachedPlan;
  }

  let response: Response;
  try {
    response = await fetch("/api/books/upload-urls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(context),
    });
  } catch {
    throw new Error(
      "Could not reach the upload server. Check your connection and try again.",
    );
  }

  const body = (await response.json()) as UploadPlan & { error?: string };
  if (!response.ok) {
    throw new Error(body.error ?? "Could not prepare upload.");
  }

  cachedPlan = body;
  cachedPlanKey = key;
  return body;
}

async function uploadToSupabaseStorage(
  bucket: "book-pdfs" | "book-covers",
  path: string,
  file: Blob | File,
  contentType: string,
  upsert: boolean,
) {
  const supabase = createClient();
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType,
    upsert,
  });
  if (error) {
    throw new Error(error.message);
  }
}

async function uploadToPresignedUrl(
  url: string,
  file: Blob | File,
  contentType: string,
) {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": contentType },
    });
  } catch {
    throw new Error(
      "Could not upload to storage. If you use R2, rerun npm run setup:r2 to refresh CORS.",
    );
  }

  if (!response.ok) {
    throw new Error(`Storage upload failed (${response.status}).`);
  }
}

export async function uploadBookFileViaApi(
  file: Blob | File,
  path: string,
  kind: UploadKind,
  contentType: string,
  context: UploadContext,
) {
  const plan = await getUploadPlan(context);

  if (plan.storage === "supabase") {
    const bucket = kind === "pdf" ? "book-pdfs" : "book-covers";
    await uploadToSupabaseStorage(
      bucket,
      path,
      file,
      contentType,
      kind === "cover",
    );
    return;
  }

  const url = kind === "pdf" ? plan.pdfUploadUrl : plan.coverUploadUrl;
  await uploadToPresignedUrl(url, file, contentType);
}
