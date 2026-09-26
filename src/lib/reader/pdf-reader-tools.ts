import type { ReaderTool } from "@/types";

export function isShapeTool(activeTool: ReaderTool) {
  return activeTool === "shape";
}

export function isDrawingTool(activeTool: ReaderTool) {
  return activeTool === "highlight" || activeTool === "pen" || isShapeTool(activeTool);
}

export function isEraserTool(activeTool: ReaderTool) {
  return activeTool === "eraser";
}

export function isInteractiveDrawLayer(activeTool: ReaderTool) {
  return isDrawingTool(activeTool) || isEraserTool(activeTool);
}

export function canNavigatePages(params: {
  editingNoteId: string | null;
  isDrawing: boolean;
  isErasing: boolean;
  activeTool: ReaderTool;
}) {
  if (params.editingNoteId || params.isDrawing || params.isErasing) return false;
  if (
    params.activeTool === "note" ||
    params.activeTool === "comment" ||
    params.activeTool === "highlight" ||
    params.activeTool === "pen" ||
    params.activeTool === "shape" ||
    params.activeTool === "pan" ||
    params.activeTool === "eraser"
  ) {
    return false;
  }
  return true;
}

export function isNoteTextTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  if (target instanceof HTMLTextAreaElement && target.closest(".note-root")) {
    return true;
  }
  // Don't steal undo/redo from chrome inputs (page #, zoom %, etc.).
  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    (target as HTMLElement).isContentEditable
  ) {
    return true;
  }
  return Boolean(target.closest("#reader-status-bar"));
}
