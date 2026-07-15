"use client";

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
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
  noteBody,
  notePreviewLabel,
  noteRotation,
  noteTitle,
  normalizeRotation,
  stickyNoteFontStack,
  stickyPaperPalette,
  STICKY_ROTATION_STEP,
} from "@/lib/reader/sticky-notes";
import { cn } from "@/lib/utils";

export type StickyNoteDraft = {
  title: string;
  body: string;
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
    startX: number;
    startY: number;
    origin: { x: number; y: number; width: number; height: number; fontSize: number };
  } | null>(null);
  const isDraggingRef = useRef(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const bodyInputRef = useRef<HTMLTextAreaElement>(null);
  const noteRootRef = useRef<HTMLDivElement>(null);

  const [localPos, setLocalPos] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
    fontSize: number;
  } | null>(null);
  const [title, setTitle] = useState(noteTitle(note));
  const [body, setBody] = useState(note.note_text);
  const [rotation, setRotation] = useState(noteRotation(note));

  const palette = stickyPaperPalette(livePaperColor ?? note.text_color);
  const preview = notePreviewLabel(note);
  const dir = detectTextDirection(`${title}\n${body}` || note.note_text || noteTitle(note));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !note.position || dragRef.current || resizeRef.current || isDraggingRef.current) {
      return;
    }
    setLocalPos(displayRectFromPagePosition(note.position, canvas));
  }, [note.position, pageViewport, canvasRef]);

  useEffect(() => {
    setRotation(noteRotation(note));
  }, [note.id, note.position?.rotation]);

  useEffect(() => {
    if (!editing) return;
    setTitle(noteTitle(note));
    setBody(note.note_text);
    const frame = requestAnimationFrame(() => {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    });
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, note.id]);

  useEffect(() => {
    if (editing) return;
    setTitle(noteTitle(note));
    setBody(note.note_text);
  }, [editing, note.note_text, note.position?.title, note.id]);

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

  function emitDraft(nextTitle: string, nextBody: string) {
    onDraftChange(note.id, { title: nextTitle, body: nextBody });
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
          title: note.position.title,
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

  function handleResizeStart(e: ReactPointerEvent<HTMLElement>) {
    e.stopPropagation();
    e.preventDefault();
    resizeRef.current = {
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
    const next = clampStickySize(
      resizeRef.current.origin.width + dx,
      resizeRef.current.origin.height + dy,
    );
    setLocalPos({
      ...resizeRef.current.origin,
      width: next.width,
      height: next.height,
    });
  }

  function handleResizeEnd(e: ReactPointerEvent<HTMLElement>) {
    if (!resizeRef.current) return;
    e.stopPropagation();
    const origin = resizeRef.current.origin;
    const dx = e.clientX - resizeRef.current.startX;
    const dy = e.clientY - resizeRef.current.startY;
    const next = clampStickySize(origin.width + dx, origin.height + dy);
    persistPosition({
      ...origin,
      width: next.width,
      height: next.height,
    });
    resizeRef.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }

  function handleFinish() {
    onFinish(note.id, { title, body });
  }

  function handleBlur(e: React.FocusEvent<HTMLElement>) {
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
        minHeight: editing ? localPos.height : undefined,
        height: editing ? undefined : localPos.height,
        transform: `rotate(${rotation}deg)`,
        transformOrigin: "center center",
        fontFamily,
      }}
      onPointerDown={(e) => e.stopPropagation()}
      dir={dir}
    >
      <div
        className={cn(
          "relative flex h-full min-h-full flex-col overflow-hidden rounded-sm shadow-[0_6px_18px_rgba(40,24,8,0.16)] backdrop-blur-[2px]",
          editing ? "min-h-[150px]" : "h-full",
        )}
        style={{
          background: `linear-gradient(160deg, ${palette.header} 0%, ${palette.paper} 48%, ${palette.paper} 100%)`,
          color: palette.ink,
          border: `1px solid ${palette.fold}`,
        }}
      >
        {/* Folded corner */}
        <div
          className="pointer-events-none absolute right-0 top-0 h-7 w-7"
          style={{
            background: `linear-gradient(225deg, transparent 48%, ${palette.fold} 50%)`,
            boxShadow: `-1px 1px 2px rgba(0,0,0,0.12)`,
          }}
          aria-hidden
        />

        {/* Drag / chrome bar */}
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
            ملاحظة
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
          <div className="flex min-h-0 flex-1 flex-col gap-1 p-2.5 pt-2" onBlur={handleBlur}>
            <input
              ref={titleInputRef}
              className="w-full bg-transparent text-[13px] font-semibold outline-none placeholder:opacity-45"
              style={{ color: palette.ink, fontSize: Math.max(12, fontSize) }}
              dir="auto"
              placeholder="العنوان"
              value={title}
              onChange={(e) => {
                const value = e.target.value;
                setTitle(value);
                emitDraft(value, body);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  bodyInputRef.current?.focus();
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  handleFinish();
                }
              }}
            />
            <div className="h-px w-full opacity-20" style={{ background: palette.ink }} />
            <textarea
              ref={bodyInputRef}
              className="min-h-[72px] w-full flex-1 resize-none bg-transparent text-[12px] leading-snug outline-none placeholder:opacity-45"
              style={{
                color: palette.ink,
                fontSize: Math.max(11, fontSize - 1),
                touchAction: "manipulation",
              }}
              dir="auto"
              placeholder="اكتب ملاحظتك..."
              value={body}
              onChange={(e) => {
                const value = e.target.value;
                setBody(value);
                emitDraft(title, value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.preventDefault();
                  handleFinish();
                }
              }}
            />
          </div>
        ) : (
          <button
            type="button"
            className="flex min-h-0 flex-1 flex-col items-stretch gap-1.5 p-3 pt-2.5 text-start"
            onClick={(e) => {
              e.stopPropagation();
              if (isDraggingRef.current) return;
              onStartEdit(note.id);
            }}
          >
            <div className="flex items-start gap-2">
              <span
                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-sm"
                style={{ background: "rgba(255,255,255,0.35)" }}
                aria-hidden
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none">
                  <path
                    d="M7 4.5h8.5A1.5 1.5 0 0 1 17 6v12.2l-2.4-1.7L12 18.2l-2.6-1.7L7 18.2V6A1.5 1.5 0 0 1 8.5 4.5H7z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                  <path d="M9.5 9h5M9.5 12h3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className="truncate text-[13px] font-semibold leading-snug"
                  style={{ fontSize: Math.max(12, fontSize) }}
                  dir="auto"
                >
                  {preview}
                </p>
                {noteBody(note) && noteTitle(note) ? (
                  <p
                    className="mt-1 line-clamp-3 text-[11px] leading-snug opacity-80"
                    style={{ fontSize: Math.max(10, fontSize - 2) }}
                    dir="auto"
                  >
                    {noteBody(note)}
                  </p>
                ) : null}
                {!noteTitle(note) && !noteBody(note) ? (
                  <p className="mt-1 text-[11px] opacity-50" dir="rtl">
                    اضغط للكتابة
                  </p>
                ) : null}
              </div>
            </div>
          </button>
        )}

        {/* Resize handle */}
        <button
          type="button"
          aria-label="Resize sticky note"
          title="Resize"
          className="absolute bottom-0 right-0 h-4 w-4 cursor-se-resize opacity-50 hover:opacity-100"
          style={{
            background: `linear-gradient(135deg, transparent 50%, ${palette.fold} 50%)`,
          }}
          onPointerDown={handleResizeStart}
          onPointerMove={handleResizeMove}
          onPointerUp={handleResizeEnd}
          onPointerCancel={handleResizeEnd}
        />
      </div>
    </div>
  );
}
