import type { PDFDocumentProxy } from "pdfjs-dist";

export const MAX_PDF_SIZE_BYTES = 50 * 1024 * 1024;

export async function loadPdfJs() {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  if (typeof window !== "undefined" && !pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
      import.meta.url,
    ).toString();
  }
  return pdfjs;
}

export async function getPdfDocument(data: ArrayBuffer): Promise<PDFDocumentProxy> {
  const pdfjs = await loadPdfJs();
  const loadingTask = pdfjs.getDocument({ data });
  return loadingTask.promise;
}

export async function extractPdfMetadata(file: File) {
  const buffer = await file.arrayBuffer();
  const pdf = await getPdfDocument(buffer);
  const totalPages = pdf.numPages;

  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 1.5 });
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    await pdf.cleanup();
    throw new Error("Could not create canvas context");
  }

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({ canvasContext: context, viewport, canvas }).promise;

  const coverBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Cover export failed"))),
      "image/jpeg",
      0.85,
    );
  });

  await pdf.cleanup();

  return { totalPages, coverBlob };
}

export function getReadButtonLabel(book: {
  last_opened_at: string | null;
}) {
  return book.last_opened_at ? "Continue Reading" : "Start Reading";
}

export function computeProgress(lastPage: number, totalPages: number | null) {
  if (!totalPages || totalPages <= 0) return 0;
  return Math.min(100, Math.round((lastPage / totalPages) * 100));
}
