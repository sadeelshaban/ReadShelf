import { idbDelete, idbGet, idbPut } from "@/lib/offline/db";
import { isOnline } from "@/lib/offline/online";

type CachedPdf = {
  bookId: string;
  buffer: ArrayBuffer;
  cachedAt: string;
  byteLength: number;
};

export async function cachePdf(bookId: string, buffer: ArrayBuffer) {
  await idbPut<CachedPdf>("pdfs", {
    bookId,
    buffer,
    cachedAt: new Date().toISOString(),
    byteLength: buffer.byteLength,
  });
}

export async function getCachedPdf(bookId: string) {
  const row = await idbGet<CachedPdf>("pdfs", bookId);
  return row?.buffer;
}

export async function removeCachedPdf(bookId: string) {
  await idbDelete("pdfs", bookId);
}

export async function loadPdfBuffer(bookId: string) {
  if (isOnline()) {
    const response = await fetch(`/api/books/${bookId}/pdf`);
    if (!response.ok) {
      const cached = await getCachedPdf(bookId);
      if (cached) return cached;
      throw new Error("Could not load PDF file.");
    }
    const buffer = await response.arrayBuffer();
    await cachePdf(bookId, buffer);
    return buffer;
  }

  const cached = await getCachedPdf(bookId);
  if (!cached) {
    throw new Error(
      "This book is not available offline. Open it once while online to download it.",
    );
  }
  return cached;
}
