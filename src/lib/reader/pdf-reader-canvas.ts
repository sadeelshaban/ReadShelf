import type { Highlight, HighlightShape, HighlightStroke } from "@/types";
import type { ShapeKind } from "@/types";
import {
  HIGHLIGHT_DRAW_ALPHA,
  HIGHLIGHT_PRESETS,
  READER_ERASER_HALO,
  READER_ERASER_RING,
  READER_ERASER_STROKE,
  hexToRgba,
} from "@/lib/reader/constants";
import { scaleStroke } from "@/lib/reader/coordinates";
import { drawShape, scaleShape, shapeKindFromHighlight } from "@/lib/reader/shapes";
import { eraserBrushRadius } from "@/lib/reader/stroke-erase";

export type HighlightDrawDraft = {
  stroke?: HighlightStroke;
  shape?: HighlightShape;
  shapeKind?: ShapeKind;
  color: string;
  type: "freeform" | "pen" | "shape";
};

export type EraserPreview = { x: number; y: number; diameter: number };

export function drawStroke(
  ctx: CanvasRenderingContext2D,
  stroke: HighlightStroke,
  colorHex: string,
) {
  if (stroke.points.length < 2) return;
  ctx.save();
  ctx.strokeStyle = hexToRgba(colorHex, HIGHLIGHT_DRAW_ALPHA);
  ctx.lineWidth = stroke.width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  // source-over keeps strokes stable across zoom redraws and overlapping
  // same-color marks (multiply on a transparent layer vanishes / darkens).
  ctx.globalCompositeOperation = "source-over";
  ctx.beginPath();
  ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
  for (let i = 1; i < stroke.points.length; i++) {
    ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
  }
  ctx.stroke();
  ctx.restore();
}

export function drawPenStroke(
  ctx: CanvasRenderingContext2D,
  stroke: HighlightStroke,
  colorHex: string,
) {
  if (stroke.points.length < 2) return;
  ctx.save();
  ctx.strokeStyle = colorHex;
  ctx.lineWidth = stroke.width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.globalCompositeOperation = "source-over";
  ctx.beginPath();
  ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
  for (let i = 1; i < stroke.points.length; i++) {
    ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
  }
  ctx.stroke();
  ctx.restore();
}

function renderCommittedHighlights(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  highlights: Highlight[],
  page: number,
) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  highlights
    .filter((h) => h.page_number === page)
    .forEach((highlight) => {
      const color = highlight.color || HIGHLIGHT_PRESETS[0].value;
      const shapeKind = shapeKindFromHighlight(highlight);
      const refW = highlight.position?.viewportWidth ?? canvas.width;
      const refH = highlight.position?.viewportHeight ?? canvas.height;

      if (shapeKind && highlight.position?.shape) {
        const scaledShape = scaleShape(
          highlight.position.shape,
          refW,
          refH,
          canvas.width,
          canvas.height,
        );
        drawShape(ctx, scaledShape, shapeKind, color);
        return;
      }

      const isPen = highlight.highlight_type === "pen";
      highlight.position?.strokes?.forEach((stroke) => {
        const scaled = scaleStroke(stroke, refW, refH, canvas.width, canvas.height);
        if (isPen) drawPenStroke(ctx, scaled, color);
        else drawStroke(ctx, scaled, color);
      });
    });
}

export function paintDraftOverlay(
  ctx: CanvasRenderingContext2D,
  draft?: HighlightDrawDraft,
  eraserPreview?: EraserPreview,
) {
  if (draft?.type === "shape" && draft.shape && draft.shapeKind) {
    drawShape(ctx, draft.shape, draft.shapeKind, draft.color);
  } else if (draft?.stroke && draft.stroke.points.length >= 2) {
    if (draft.type === "pen") drawPenStroke(ctx, draft.stroke, draft.color);
    else drawStroke(ctx, draft.stroke, draft.color);
  } else if (draft?.stroke && draft.stroke.points.length === 1) {
    const point = draft.stroke.points[0];
    const radius = Math.max(2, draft.stroke.width / 2);
    ctx.save();
    if (draft.type === "pen") {
      ctx.fillStyle = draft.color;
      ctx.globalCompositeOperation = "source-over";
    } else {
      ctx.fillStyle = hexToRgba(draft.color, HIGHLIGHT_DRAW_ALPHA);
      ctx.globalCompositeOperation = "source-over";
    }
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  if (eraserPreview) {
    const radius = eraserBrushRadius(eraserPreview.diameter);
    ctx.save();
    ctx.fillStyle = READER_ERASER_RING;
    ctx.strokeStyle = READER_ERASER_HALO;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(eraserPreview.x, eraserPreview.y, radius + 1.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = READER_ERASER_STROKE;
    ctx.lineWidth = 1.75;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(eraserPreview.x, eraserPreview.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

export function syncHighlightBackup(
  backup: HTMLCanvasElement,
  highlights: Highlight[],
  page: number,
  source: HTMLCanvasElement,
) {
  if (backup.width !== source.width || backup.height !== source.height) {
    backup.width = source.width;
    backup.height = source.height;
  }

  const ctx = backup.getContext("2d");
  if (!ctx) return;
  renderCommittedHighlights(ctx, backup, highlights, page);
}

export function compositeHighlightLayer(
  canvas: HTMLCanvasElement,
  backup: HTMLCanvasElement,
  draft?: HighlightDrawDraft,
  eraserPreview?: EraserPreview,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(backup, 0, 0);
  paintDraftOverlay(ctx, draft, eraserPreview);
}

export function redrawHighlightLayer(
  canvas: HTMLCanvasElement,
  highlights: Highlight[],
  page: number,
  draft?: HighlightDrawDraft,
  eraserPreview?: EraserPreview,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  renderCommittedHighlights(ctx, canvas, highlights, page);
  paintDraftOverlay(ctx, draft, eraserPreview);
}
