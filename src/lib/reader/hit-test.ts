import type { Highlight, Note } from "@/types";
import {
  isShapeHighlight,
  scaleShape,
  shapeContainsPoint,
  shapeKindFromHighlight,
} from "@/lib/reader/shapes";

export function findShapeAtPoint(
  highlights: Highlight[],
  pageNumber: number,
  point: { x: number; y: number },
  canvas: HTMLCanvasElement,
  threshold = 12,
): Highlight | null {
  const pageShapes = highlights.filter(
    (h) => h.page_number === pageNumber && isShapeHighlight(h) && h.position?.shape,
  );

  for (let i = pageShapes.length - 1; i >= 0; i -= 1) {
    const highlight = pageShapes[i];
    const kind = shapeKindFromHighlight(highlight);
    const rawShape = highlight.position?.shape;
    if (!kind || !rawShape) continue;

    const refW = highlight.position?.viewportWidth ?? canvas.width;
    const refH = highlight.position?.viewportHeight ?? canvas.height;
    const shape =
      refW === canvas.width && refH === canvas.height
        ? rawShape
        : scaleShape(rawShape, refW, refH, canvas.width, canvas.height);

    if (shapeContainsPoint(shape, kind, point, threshold)) {
      return highlight;
    }
  }

  return null;
}

export function findNoteAtPoint(
  notes: Note[],
  pageNumber: number,
  point: { x: number; y: number },
  canvas: HTMLCanvasElement,
): Note | null {
  const pageNotes = notes.filter((n) => n.page_number === pageNumber);

  for (let i = pageNotes.length - 1; i >= 0; i -= 1) {
    const note = pageNotes[i];
    if (!note.position) continue;
    const refW = note.position.viewportWidth ?? canvas.width;
    const refH = note.position.viewportHeight ?? canvas.height;
    const scaleX = canvas.width / refW;
    const scaleY = canvas.height / refH;
    const x = note.position.x * scaleX;
    const y = note.position.y * scaleY;
    const w = note.position.width * scaleX;
    const h = note.position.height * scaleY;
    if (point.x >= x && point.x <= x + w && point.y >= y && point.y <= y + h) {
      return note;
    }
  }

  return null;
}
