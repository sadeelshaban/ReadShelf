type UploadUrlsResponse =
  | { storage: "supabase" }
  | {
      storage: "r2";
      pdfUploadUrl: string;
      coverUploadUrl: string;
    };

export async function requestUploadPlan(input: {
  bookId: string;
  pdfPath: string;
  coverPath: string;
  coverContentType: string;
}) {
  const response = await fetch("/api/books/upload-urls", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const body = (await response.json()) as UploadUrlsResponse & { error?: string };
  if (!response.ok) {
    throw new Error(body.error ?? "Could not prepare upload.");
  }

  return body;
}

export async function uploadViaPresignedUrl(
  url: string,
  body: Blob | File,
  contentType: string,
) {
  const response = await fetch(url, {
    method: "PUT",
    body,
    headers: { "Content-Type": contentType },
  });

  if (!response.ok) {
    throw new Error("File upload failed.");
  }
}
