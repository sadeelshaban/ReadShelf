import type { PDFDocumentProxy } from "pdfjs-dist";

export const MAX_PDF_SIZE_BYTES = 50 * 1024 * 1024;

export async function loadPdfJs() {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  if (typeof window !== "undefined" && !pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  }
  return pdfjs;
}

export function getPdfDocumentOptions(data: ArrayBuffer | Uint8Array) {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  return {
    data: bytes,
    standardFontDataUrl: "/standard_fonts/",
    cMapUrl: "/cmaps/",
    cMapPacked: true,
    wasmUrl: "/wasm/",
    iccUrl: "/iccs/",
    disableFontFace: true,
    useSystemFonts: false,
  };
}

export async function getPdfDocument(data: ArrayBuffer): Promise<PDFDocumentProxy> {
  const pdfjs = await loadPdfJs();
  const loadingTask = pdfjs.getDocument(getPdfDocumentOptions(data));
  return loadingTask.promise;
}

export async function extractPdfMetadata(file: File) {
  const buffer = await file.arrayBuffer();
  let pdf: PDFDocumentProxy | null = null;

  try {
    pdf = await getPdfDocument(buffer);
    const totalPages = pdf.numPages;

    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Could not create canvas context.");
    }

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: context, viewport, canvas }).promise;

    const coverBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) =>
          blob
            ? resolve(blob)
            : reject(new Error("Could not create cover from the first PDF page.")),
        "image/jpeg",
        0.92,
      );
    });

    return { totalPages, coverBlob };
  } finally {
    await pdf?.cleanup();
  }
}

export function getReadButtonLabel(book: {
  last_opened_at: string | null;
  progress_percent: number;
}) {
  if (book.progress_percent >= 100) return "Read Again";
  return book.last_opened_at ? "Continue Reading" : "Start Reading";
}

export function computeProgress(lastPage: number, totalPages: number | null) {
  if (!totalPages || totalPages <= 0) return 0;
  return Math.min(100, Math.round((lastPage / totalPages) * 100));
}
