"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type FocusEvent as ReactFocusEvent,
} from "react";
import type { Note, NotePosition } from "@/types";
import {
  displayFontSizeFromLayout,
  displayRectFromPagePosition,
  pagePositionFromDisplay,
  type ViewportSize,
} from "@/lib/reader/coordinates";
import { DEFAULT_NOTE_FONT_SIZE } from "@/lib/reader/constants";
import {
  clampStickySize,
  detectTextDirection,
  MAX_STICKY_NOTE_CHARS,
  noteBody,
  noteRotation,
  normalizeRotation,
  stickyNoteFontStack,
  stickyPaperPalette,
  STICKY_ROTATION_STEP,
} from "@/lib/reader/sticky-notes";

type ResizeHandle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

function applyResize(
  handle: ResizeHandle,
  origin: { x: number; y: number; width: number; height: number },
  dx: number,
  dy: number,
) {
  let x = origin.x;
  let y = origin.y;
  let width = origin.width;
  let height = origin.height;

  if (handle.includes("e")) width = origin.width + dx;
  if (handle.includes("w")) {
    width = origin.width - dx;
    x = origin.x + dx;
  }
  if (handle.includes("s")) height = origin.height + dy;
  if (handle.includes("n")) {
    height = origin.height - dy;
    y = origin.y + dy;
  }

  const clamped = clampStickySize(width, height);
  if (handle.includes("w")) {
    x = origin.x + origin.width - clamped.width;
  }
  if (handle.includes("n")) {
    y = origin.y + origin.height - clamped.height;
  }

  return {
    x,
    y,
    width: clamped.width,
    height: clamped.height,
  };
}

const RESIZE_HANDLES: Array<{
  id: ResizeHandle;
  edgeClassName: string;
  style: CSSProperties;
  cursor: string;
  label: string;
}> = [
  { id: "n", edgeClassName: "left-[0.5em] right-[0.5em] top-0", style: { height: "0.45em" }, cursor: "ns-resize", label: "Resize top edge" },
  { id: "s", edgeClassName: "bottom-0 left-[0.5em] right-[0.5em]", style: { height: "0.45em" }, cursor: "ns-resize", label: "Resize bottom edge" },
  { id: "w", edgeClassName: "bottom-[0.5em] left-0 top-[0.5em]", style: { width: "0.45em" }, cursor: "ew-resize", label: "Resize left edge" },
  { id: "e", edgeClassName: "bottom-[0.5em] right-0 top-[0.5em]", style: { width: "0.45em" }, cursor: "ew-resize", label: "Resize right edge" },
  { id: "nw", edgeClassName: "left-0 top-0", style: { width: "0.65em", height: "0.65em" }, cursor: "nwse-resize", label: "Resize top-left corner" },
  { id: "ne", edgeClassName: "right-0 top-0", style: { width: "0.65em", height: "0.65em" }, cursor: "nesw-resize", label: "Resize top-right corner" },
  { id: "sw", edgeClassName: "bottom-0 left-0", style: { width: "0.65em", height: "0.65em" }, cursor: "nesw-resize", label: "Resize bottom-left corner" },
  { id: "se", edgeClassName: "bottom-0 right-0", style: { width: "0.65em", height: "0.65em" }, cursor: "nwse-resize", label: "Resize bottom-right corner" },
];

export type StickyNoteDraft = {
  title: string;
  body: string;
  width?: number;
  height?: number;
};

export type PageNoteProps = {
  note: Note;
  editing: boolean;
  liveFontSize?: number;
  livePaperColor?: string;
  onFinish: (id: string, draft: StickyNoteDraft) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, position: NotePosition) => void;
  onStartEdit: (id: string) => void;
  onDraftChange: (id: string, draft: StickyNoteDraft) => void;
  onRotate: (id: string, rotation: number) => void;
  canvasRef: { current: HTMLCanvasElement | null };
  canvasDisplayWidth: number;
  pageViewport: ViewportSize;
};

export function PageNote({
  note,
  editing,
  liveFontSize,
  livePaperColor,
  onFinish,
  onDelete,
  onMove,
  onStartEdit,
  onDraftChange,
  onRotate,
  canvasRef,
  canvasDisplayWidth,
  pageViewport,
}: PageNoteProps) {
  const dragRef = useRef<{
    startX: number;
    startY: number;
    origin: { x: number; y: number; width: number; height: number; fontSize: number };
    dragging: boolean;
  } | null>(null);
  const resizeRef = useRef<{
    handle: ResizeHandle;
    startX: number;
    startY: number;
    origin: { x: number; y: number; width: number; height: number; fontSize: number };
  } | null>(null);
  const isDraggingRef = useRef(false);
  const isResizingRef = useRef(false);
  const bodyInputRef = useRef<HTMLTextAreaElement>(null);
  const noteRootRef = useRef<HTMLDivElement>(null);

  const [localPos, setLocalPos] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
    fontSize: number;
  } | null>(null);
  const [body, setBody] = useState(note.note_text);
  const [rotation, setRotation] = useState(noteRotation(note));

  const palette = stickyPaperPalette(livePaperColor ?? note.text_color);
  const savedBody = noteBody(note);
  const dir = detectTextDirection(body || savedBody);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !note.position || dragRef.current || resizeRef.current || isDraggingRef.current) {
      return;
    }
    setLocalPos(displayRectFromPagePosition(note.position, canvas));
  }, [note.position, pageViewport, canvasDisplayWidth, canvasRef]);

  useEffect(() => {
    setRotation(noteRotation(note));
  }, [note.id, note.position?.rotation]);

  useEffect(() => {
    if (!editing) return;
    setBody(note.note_text);
    const frame = requestAnimationFrame(() => {
      bodyInputRef.current?.focus();
      bodyInputRef.current?.setSelectionRange(
        bodyInputRef.current.value.length,
        bodyInputRef.current.value.length,
      );
    });
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, note.id]);

  useEffect(() => {
    if (editing) return;
    setBody(note.note_text);
  }, [editing, note.note_text, note.id]);

  const fontSize =
    editing && liveFontSize != null && canvasDisplayWidth > 0
      ? displayFontSizeFromLayout(
          liveFontSize,
          canvasDisplayWidth,
          pageViewport.width,
          note.position,
        )
      : (localPos?.fontSize ?? DEFAULT_NOTE_FONT_SIZE);

  if (!localPos || !note.position) return null;

  function buildDraft(nextBody: string, display = localPos!) {
    const clamped = clampStickySize(display.width, display.height);
    return {
      title: "",
      body: nextBody,
      width: clamped.width,
      height: clamped.height,
    };
  }

  function emitDraft(nextBody: string) {
    onDraftChange(note.id, buildDraft(nextBody));
  }

  function persistPosition(display: {
    x: number;
    y: number;
    width: number;
    height: number;
    fontSize: number;
  }) {
    const canvas = canvasRef.current;
    if (!canvas || !note.position) return;
    const clamped = clampStickySize(display.width, display.height);
    const nextDisplay = { ...display, ...clamped };
    setLocalPos(nextDisplay);
    onMove(
      note.id,
      pagePositionFromDisplay(
        {
          ...nextDisplay,
          fontSize: display.fontSize,
        },
        canvas,
        {
          ...note.position,
          title: "",
          rotation,
        },
      ),
    );
  }

  function handleResizeStart(handle: ResizeHandle, e: ReactPointerEvent<HTMLElement>) {
    e.stopPropagation();
    e.preventDefault();
    isResizingRef.current = true;
    resizeRef.current = {
      handle,
      startX: e.clientX,
      startY: e.clientY,
      origin: localPos!,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handleResizeMove(e: ReactPointerEvent<HTMLElement>) {
    if (!resizeRef.current) return;
    e.stopPropagation();
    e.preventDefault();
    const dx = e.clientX - resizeRef.current.startX;
    const dy = e.clientY - resizeRef.current.startY;
    const next = applyResize(resizeRef.current.handle, resizeRef.current.origin, dx, dy);
    setLocalPos({
      ...resizeRef.current.origin,
      ...next,
    });
  }

  function handleResizeEnd(e: ReactPointerEvent<HTMLElement>) {
    if (!resizeRef.current) return;
    e.stopPropagation();
    const dx = e.clientX - resizeRef.current.startX;
    const dy = e.clientY - resizeRef.current.startY;
    const next = applyResize(resizeRef.current.handle, resizeRef.current.origin, dx, dy);
    const nextDisplay = {
      ...resizeRef.current.origin,
      ...next,
    };
    onDraftChange(note.id, buildDraft(body, nextDisplay));
    persistPosition(nextDisplay);
    resizeRef.current = null;
    window.setTimeout(() => {
      isResizingRef.current = false;
    }, 0);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }

  function handleDragStart(e: ReactPointerEvent<HTMLElement>) {
    e.stopPropagation();
    e.preventDefault();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origin: localPos!,
      dragging: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handleDragMove(e: ReactPointerEvent<HTMLElement>) {
    if (!dragRef.current) return;
    e.stopPropagation();
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (!dragRef.current.dragging) {
      if (Math.hypot(dx, dy) < 4) return;
      dragRef.current.dragging = true;
      isDraggingRef.current = true;
      e.preventDefault();
    }
    setLocalPos({
      ...dragRef.current.origin,
      x: dragRef.current.origin.x + dx,
      y: dragRef.current.origin.y + dy,
    });
  }

  function handleDragEnd(e: ReactPointerEvent<HTMLElement>) {
    if (!dragRef.current) return;
    e.stopPropagation();
    const drag = dragRef.current;
    if (drag.dragging) {
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      persistPosition({
        ...drag.origin,
        x: drag.origin.x + dx,
        y: drag.origin.y + dy,
      });
    }
    dragRef.current = null;
    window.setTimeout(() => {
      isDraggingRef.current = false;
    }, 0);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }

  function handleFinish() {
    onFinish(note.id, buildDraft(body));
  }

  function handleBlur(e: ReactFocusEvent<HTMLElement>) {
    if (!editing) return;
    const related = e.relatedTarget as Element | null;
    if (related?.closest("#note-toolbar")) return;
    if (related && noteRootRef.current?.contains(related)) return;
    handleFinish();
  }

  function bumpRotation(delta: number) {
    const next = normalizeRotation(rotation + delta);
    setRotation(next);
    onRotate(note.id, next);
  }

  function handleBodyKeyDown(e: ReactKeyboardEvent<HTMLTextAreaElement>) {
    if ((e.ctrlKey || e.metaKey) && (e.code === "KeyY" || (e.code === "KeyZ" && e.shiftKey))) {
      e.preventDefault();
      document.execCommand("redo");
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      handleFinish();
    }
  }

  const fontFamily = stickyNoteFontStack();

  return (
    <div
      ref={noteRootRef}
      data-note-id={note.id}
      className="note-root absolute z-20"
      style={{
        left: localPos.x,
        top: localPos.y,
        width: localPos.width,
        height: localPos.height,
        fontSize,
        transform: `rotate(${rotation}deg)`,
        transformOrigin: "center center",
        fontFamily,
      }}
      onPointerDown={(e) => e.stopPropagation()}
      dir={dir}
    >
      <div
        className="relative flex h-full min-h-full flex-col overflow-hidden rounded-sm shadow-[0_6px_18px_rgba(40,24,8,0.16)] backdrop-blur-[2px]"
        style={{
          background: `linear-gradient(160deg, ${palette.header} 0%, ${palette.paper} 48%, ${palette.paper} 100%)`,
          color: palette.ink,
          border: `1px solid ${palette.fold}`,
        }}
      >
        <div
          className="pointer-events-none absolute right-0 top-0"
          style={{
            width: "1.75em",
            height: "1.75em",
            background: `linear-gradient(225deg, transparent 48%, ${palette.fold} 50%)`,
            boxShadow: `-1px 1px 2px rgba(0,0,0,0.12)`,
          }}
          aria-hidden
        />

        <div
          className="flex items-center border-b"
          style={{
            gap: "0.25em",
            padding: "0.35em 0.5em",
            borderColor: "rgba(0,0,0,0.06)",
            background: palette.header,
          }}
          onPointerDown={handleDragStart}
          onPointerMove={handleDragMove}
          onPointerUp={handleDragEnd}
          onPointerCancel={handleDragEnd}
        >
          <span
            className="flex cursor-grab items-center justify-center rounded opacity-70 active:cursor-grabbing"
            style={{ width: "1.25em", height: "1.25em", fontSize: "0.85em" }}
            aria-hidden
          >
            <svg viewBox="0 0 16 16" style={{ width: "1em", height: "1em" }}>
              <circle cx="5" cy="4" r="1.1" fill="currentColor" />
              <circle cx="11" cy="4" r="1.1" fill="currentColor" />
              <circle cx="5" cy="8" r="1.1" fill="currentColor" />
              <circle cx="11" cy="8" r="1.1" fill="currentColor" />
              <circle cx="5" cy="12" r="1.1" fill="currentColor" />
              <circle cx="11" cy="12" r="1.1" fill="currentColor" />
            </svg>
          </span>
          <span
            className="flex-1 truncate font-semibold tracking-wide opacity-70"
            style={{ fontSize: "0.72em" }}
          >
            Note
          </span>
          <button
            type="button"
            title="Rotate left"
            aria-label="Rotate left"
            className="flex items-center justify-center rounded opacity-70 hover:bg-black/5 hover:opacity-100"
            style={{ width: "1.25em", height: "1.25em" }}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              bumpRotation(-STICKY_ROTATION_STEP);
            }}
          >
            <svg viewBox="0 0 16 16" style={{ width: "1em", height: "1em" }} fill="none" aria-hidden>
              <path
                d="M3.5 7.5a4.5 4.5 0 1 1 1.2 3.1"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path d="M3 5.2v2.6h2.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            title="Rotate right"
            aria-label="Rotate right"
            className="flex items-center justify-center rounded opacity-70 hover:bg-black/5 hover:opacity-100"
            style={{ width: "1.25em", height: "1.25em" }}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              bumpRotation(STICKY_ROTATION_STEP);
            }}
          >
            <svg viewBox="0 0 16 16" style={{ width: "1em", height: "1em" }} fill="none" aria-hidden>
              <path
                d="M12.5 7.5a4.5 4.5 0 1 0-1.2 3.1"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path d="M13 5.2v2.6h-2.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            title="Delete"
            aria-label="Delete sticky note"
            className="flex items-center justify-center rounded opacity-70 hover:bg-black/5 hover:opacity-100"
            style={{ width: "1.25em", height: "1.25em" }}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(note.id);
            }}
          >
            <svg viewBox="0 0 16 16" style={{ width: "1em", height: "1em" }} fill="none" aria-hidden>
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {editing ? (
          <div
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
            style={{ padding: "0.65em 0.75em 0.5em" }}
            onBlur={handleBlur}
          >
            <textarea
              ref={bodyInputRef}
              className="h-full min-h-0 w-full flex-1 resize-none overflow-y-auto bg-transparent leading-snug outline-none placeholder:opacity-45"
              style={{
                color: palette.ink,
                fontSize: "0.92em",
                touchAction: "manipulation",
              }}
              dir="auto"
              maxLength={MAX_STICKY_NOTE_CHARS}
              placeholder="Write your note..."
              value={body}
              onChange={(e) => {
                const value = e.target.value.slice(0, MAX_STICKY_NOTE_CHARS);
                setBody(value);
                emitDraft(value);
              }}
              onKeyDown={handleBodyKeyDown}
            />
          </div>
        ) : (
          <button
            type="button"
            className="flex min-h-0 flex-1 flex-col items-stretch overflow-y-auto text-start"
            style={{ padding: "0.75em 0.85em 0.65em" }}
            onClick={(e) => {
              e.stopPropagation();
              if (isDraggingRef.current || isResizingRef.current) return;
              onStartEdit(note.id);
            }}
          >
            {savedBody ? (
              <p
                className="whitespace-pre-wrap leading-snug"
                style={{ fontSize: "0.92em" }}
                dir="auto"
              >
                {savedBody}
              </p>
            ) : (
              <p className="opacity-50" style={{ fontSize: "0.92em" }}>
                Click to write
              </p>
            )}
          </button>
        )}

        {RESIZE_HANDLES.map((handle) => (
          <button
            key={handle.id}
            type="button"
            aria-label={handle.label}
            title={handle.label}
            className={`absolute z-30 touch-none opacity-0 ${handle.edgeClassName}`}
            style={{ cursor: handle.cursor, ...handle.style }}
            onPointerDown={(e) => handleResizeStart(handle.id, e)}
            onPointerMove={handleResizeMove}
            onPointerUp={handleResizeEnd}
            onPointerCancel={handleResizeEnd}
          />
        ))}
      </div>
    </div>
  );
}
