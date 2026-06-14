import type { Highlight, Note } from "@/types";

function distanceToSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq === 0) {
    return Math.hypot(px - x1, py - y1);
  }
  let t = ((px - x1) * dx + (py - y1) * dy) / lengthSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

function scalePoint(
  point: { x: number; y: number },
  canvas: HTMLCanvasElement,
  viewportWidth: number,
  viewportHeight: number,
) {
  const scaleX = canvas.width / viewportWidth;
  const scaleY = canvas.height / viewportHeight;
  return { x: point.x * scaleX, y: point.y * scaleY };
}

export function findHighlightAtPoint(
  highlights: Highlight[],
  pageNumber: number,
  point: { x: number; y: number },
  canvas: HTMLCanvasElement,
  threshold = 14,
): Highlight | null {
  const pageHighlights = highlights.filter((h) => h.page_number === pageNumber);

  for (let i = pageHighlights.length - 1; i >= 0; i -= 1) {
    const highlight = pageHighlights[i];
    const refW = highlight.position?.viewportWidth ?? canvas.width;
    const refH = highlight.position?.viewportHeight ?? canvas.height;

    for (const stroke of highlight.position?.strokes ?? []) {
      const hitRadius = threshold + stroke.width / 2;
      for (let j = 1; j < stroke.points.length; j += 1) {
        const p1 = scalePoint(stroke.points[j - 1], canvas, refW, refH);
        const p2 = scalePoint(stroke.points[j], canvas, refW, refH);
        if (
          distanceToSegment(point.x, point.y, p1.x, p1.y, p2.x, p2.y) <= hitRadius
        ) {
          return highlight;
        }
      }
      if (stroke.points.length === 1) {
        const p = scalePoint(stroke.points[0], canvas, refW, refH);
        if (Math.hypot(point.x - p.x, point.y - p.y) <= hitRadius) {
          return highlight;
        }
      }
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
