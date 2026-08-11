"use client";

import {
  useEffect,
  useRef,
  useState,
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
  bumpStickySize,
  clampStickySize,
  detectTextDirection,
  MAX_STICKY_HEIGHT,
  MAX_STICKY_NOTE_CHARS,
  MAX_STICKY_WIDTH,
  MIN_STICKY_HEIGHT,
  MIN_STICKY_WIDTH,
  noteBody,
  noteRotation,
  normalizeRotation,
  stickyNoteFontStack,
  stickyPaperPalette,
  STICKY_ROTATION_STEP,
  STICKY_SIZE_STEP,
} from "@/lib/reader/sticky-notes";

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
  const isDraggingRef = useRef(false);
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
    if (!canvas || !note.position || dragRef.current || isDraggingRef.current) {
      return;
    }
    setLocalPos(displayRectFromPagePosition(note.position, canvas));
  }, [note.position, pageViewport, canvasRef]);

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

  function bumpSize(delta: number) {
    const next = bumpStickySize(localPos!.width, localPos!.height, delta);
    const nextDisplay = { ...localPos!, ...next };
    setLocalPos(nextDisplay);
    onDraftChange(note.id, buildDraft(body, nextDisplay));
    persistPosition(nextDisplay);
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
  const atMinSize = localPos.width <= MIN_STICKY_WIDTH && localPos.height <= MIN_STICKY_HEIGHT;
  const atMaxSize = localPos.width >= MAX_STICKY_WIDTH && localPos.height >= MAX_STICKY_HEIGHT;

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
        transform: `rotate(${rotation}deg)`,
        transformOrigin: "center center",
        fontFamily,
      }}
      onPointerDown={(e) => e.stopPropagation()}
      dir={dir}
    >
      <button
        type="button"
        title="Smaller"
        aria-label="Make note smaller"
        disabled={atMinSize}
        className="absolute left-0 top-1/2 z-30 flex h-7 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-sm opacity-80 shadow-sm transition hover:opacity-100 disabled:pointer-events-none disabled:opacity-25"
        style={{
          background: palette.header,
          color: palette.ink,
          border: `1px solid ${palette.fold}`,
        }}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          bumpSize(-STICKY_SIZE_STEP);
        }}
      >
        <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" aria-hidden>
          <path d="M10 4 6 8l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <button
        type="button"
        title="Larger"
        aria-label="Make note larger"
        disabled={atMaxSize}
        className="absolute right-0 top-1/2 z-30 flex h-7 w-5 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-sm opacity-80 shadow-sm transition hover:opacity-100 disabled:pointer-events-none disabled:opacity-25"
        style={{
          background: palette.header,
          color: palette.ink,
          border: `1px solid ${palette.fold}`,
        }}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          bumpSize(STICKY_SIZE_STEP);
        }}
      >
        <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" aria-hidden>
          <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div
        className="relative flex h-full min-h-full flex-col overflow-hidden rounded-sm shadow-[0_6px_18px_rgba(40,24,8,0.16)] backdrop-blur-[2px]"
        style={{
          background: `linear-gradient(160deg, ${palette.header} 0%, ${palette.paper} 48%, ${palette.paper} 100%)`,
          color: palette.ink,
          border: `1px solid ${palette.fold}`,
        }}
      >
        <div
          className="pointer-events-none absolute right-0 top-0 h-7 w-7"
          style={{
            background: `linear-gradient(225deg, transparent 48%, ${palette.fold} 50%)`,
            boxShadow: `-1px 1px 2px rgba(0,0,0,0.12)`,
          }}
          aria-hidden
        />

        <div
          className="flex items-center gap-1 border-b px-1.5 py-1"
          style={{
            borderColor: "rgba(0,0,0,0.06)",
            background: palette.header,
          }}
          onPointerDown={handleDragStart}
          onPointerMove={handleDragMove}
          onPointerUp={handleDragEnd}
          onPointerCancel={handleDragEnd}
        >
          <span
            className="flex h-5 w-5 cursor-grab items-center justify-center rounded text-[10px] opacity-70 active:cursor-grabbing"
            aria-hidden
          >
            <svg viewBox="0 0 16 16" className="h-3 w-3">
              <circle cx="5" cy="4" r="1.1" fill="currentColor" />
              <circle cx="11" cy="4" r="1.1" fill="currentColor" />
              <circle cx="5" cy="8" r="1.1" fill="currentColor" />
              <circle cx="11" cy="8" r="1.1" fill="currentColor" />
              <circle cx="5" cy="12" r="1.1" fill="currentColor" />
              <circle cx="11" cy="12" r="1.1" fill="currentColor" />
            </svg>
          </span>
          <span className="flex-1 truncate text-[10px] font-semibold tracking-wide opacity-70">
            Note
          </span>
          <button
            type="button"
            title="Rotate left"
            aria-label="Rotate left"
            className="flex h-5 w-5 items-center justify-center rounded opacity-70 hover:bg-black/5 hover:opacity-100"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              bumpRotation(-STICKY_ROTATION_STEP);
            }}
          >
            <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" aria-hidden>
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
            className="flex h-5 w-5 items-center justify-center rounded opacity-70 hover:bg-black/5 hover:opacity-100"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              bumpRotation(STICKY_ROTATION_STEP);
            }}
          >
            <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" aria-hidden>
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
            className="flex h-5 w-5 items-center justify-center rounded opacity-70 hover:bg-black/5 hover:opacity-100"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(note.id);
            }}
          >
            <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" aria-hidden>
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {editing ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-2.5 pt-2" onBlur={handleBlur}>
            <textarea
              ref={bodyInputRef}
              className="h-full min-h-0 w-full flex-1 resize-none overflow-y-auto bg-transparent text-[12px] leading-snug outline-none placeholder:opacity-45"
              style={{
                color: palette.ink,
                fontSize: Math.max(11, fontSize - 1),
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
            className="flex min-h-0 flex-1 flex-col items-stretch overflow-y-auto p-3 pt-2.5 text-start"
            onClick={(e) => {
              e.stopPropagation();
              if (isDraggingRef.current) return;
              onStartEdit(note.id);
            }}
          >
            {savedBody ? (
              <p
                className="whitespace-pre-wrap text-[12px] leading-snug"
                style={{ fontSize: Math.max(11, fontSize - 1) }}
                dir="auto"
              >
                {savedBody}
              </p>
            ) : (
              <p className="text-[12px] opacity-50" style={{ fontSize: Math.max(11, fontSize - 1) }}>
                Click to write
              </p>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
