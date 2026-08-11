import type { HighlightStroke, NotePosition } from "@/types";
import { DEFAULT_NOTE_FONT_SIZE } from "@/lib/reader/constants";
import {
  DEFAULT_COMMENT_HEIGHT,
  DEFAULT_COMMENT_WIDTH,
} from "@/lib/reader/sticky-notes";

export type ViewportSize = {
  width: number;
  height: number;
};

export function canvasPointFromClient(
  clientX: number,
  clientY: number,
  canvas: HTMLCanvasElement,
) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (clientX - rect.left) * (canvas.width / rect.width),
    y: (clientY - rect.top) * (canvas.height / rect.height),
  };
}

export function displayRectFromPagePosition(
  pos: NotePosition,
  canvas: HTMLCanvasElement,
) {
  const refW = pos.viewportWidth ?? canvas.width;
  const refH = pos.viewportHeight ?? canvas.height;
  const rect = canvas.getBoundingClientRect();
  const sx = rect.width / refW;
  const sy = rect.height / refH;
  return {
    x: pos.x * sx,
    y: pos.y * sy,
    width: pos.width * sx,
    height: pos.height * sy,
    fontSize: (pos.fontSize ?? DEFAULT_NOTE_FONT_SIZE) * sx,
  };
}

export function pagePositionFromDisplay(
  display: {
    x: number;
    y: number;
    width: number;
    height: number;
    fontSize?: number;
  },
  canvas: HTMLCanvasElement,
  previous?: NotePosition | null,
): NotePosition {
  const rect = canvas.getBoundingClientRect();
  const sx = canvas.width / Math.max(rect.width, 1);
  const sy = canvas.height / Math.max(rect.height, 1);
  return {
    x: display.x * sx,
    y: display.y * sy,
    width: display.width * sx,
    height: display.height * sy,
    fontSize: display.fontSize
      ? display.fontSize * sx
      : previous?.fontSize != null
        ? previous.fontSize * (canvas.width / (previous.viewportWidth ?? canvas.width))
        : undefined,
    title: previous?.title,
    rotation: previous?.rotation,
    kind: previous?.kind,
    viewportWidth: canvas.width,
    viewportHeight: canvas.height,
  };
}

export function displayFontSizeFromLayout(
  pageFontSize: number,
  displayWidth: number,
  pageViewportWidth: number,
  previous?: NotePosition | null,
) {
  if (displayWidth <= 0 || pageViewportWidth <= 0) {
    return DEFAULT_NOTE_FONT_SIZE;
  }
  const refW = previous?.viewportWidth ?? pageViewportWidth;
  return (pageFontSize * displayWidth) / refW;
}

/** Comments scale with the page like sticky notes, highlights, and pen strokes. */
export function displayCommentFromPagePosition(
  pos: NotePosition,
  canvas: HTMLCanvasElement,
) {
  return displayRectFromPagePosition(pos, canvas);
}

export function pageCommentPositionFromDisplay(
  display: {
    x: number;
    y: number;
    width?: number;
    height?: number;
    fontSize?: number;
  },
  canvas: HTMLCanvasElement,
  previous?: NotePosition | null,
): NotePosition {
  return pagePositionFromDisplay(
    {
      x: display.x,
      y: display.y,
      width: display.width ?? previous?.width ?? DEFAULT_COMMENT_WIDTH,
      height: display.height ?? previous?.height ?? DEFAULT_COMMENT_HEIGHT,
      fontSize: display.fontSize,
    },
    canvas,
    previous,
  );
}

/** Convert legacy screen-pixel comments back to page-anchored coordinates. */
export function migrateCommentToPageAnchored(
  pos: NotePosition,
  canvas: HTMLCanvasElement,
): NotePosition {
  if (!pos.commentFontScreen) {
    return pos;
  }

  const refW = pos.viewportWidth ?? canvas.width;
  const sx = canvas.getBoundingClientRect().width / Math.max(refW, 1);
  const { commentFontScreen: _flag, ...rest } = pos;

  return {
    ...rest,
    fontSize: (pos.fontSize ?? DEFAULT_NOTE_FONT_SIZE) / Math.max(sx, 0.0001),
  };
}

export function scaleStroke(
  stroke: HighlightStroke,
  refW: number,
  refH: number,
  curW: number,
  curH: number,
): HighlightStroke {
  const sx = curW / refW;
  const sy = curH / refH;
  return {
    width: stroke.width * sx,
    points: stroke.points.map((point) => ({
      x: point.x * sx,
      y: point.y * sy,
    })),
  };
}
