"use client";

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { Note, NotePosition } from "@/types";
import {
  displayRectFromPagePosition,
  pagePositionFromDisplay,
  type ViewportSize,
} from "@/lib/reader/coordinates";
import {
  detectTextDirection,
  stickyNoteFontStack,
} from "@/lib/reader/sticky-notes";
import { cn } from "@/lib/utils";

export type PageCommentProps = {
  note: Note;
  editing: boolean;
  onFinish: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, position: NotePosition) => void;
  onStartEdit: (id: string) => void;
  onDraftChange: (id: string, text: string) => void;
  canvasRef: { current: HTMLCanvasElement | null };
  pageViewport: ViewportSize;
};

/**
 * Pre-sticky style comment: light body-only bubble, Arabic-friendly, distinct from sticky notes.
 */
export function PageComment({
  note,
  editing,
  onFinish,
  onDelete,
  onMove,
  onStartEdit,
  onDraftChange,
  canvasRef,
  pageViewport,
}: PageCommentProps) {
  const dragRef = useRef<{
    startX: number;
    startY: number;
    origin: { x: number; y: number; width: number; height: number; fontSize: number };
    dragging: boolean;
  } | null>(null);
  const isDraggingRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [localPos, setLocalPos] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
    fontSize: number;
  } | null>(null);
  const [text, setText] = useState(note.note_text);
  const [showActions, setShowActions] = useState(false);

  const dir = detectTextDirection(text || note.note_text);
  const display = note.note_text.trim();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !note.position || dragRef.current || isDraggingRef.current) return;
    setLocalPos(displayRectFromPagePosition(note.position, canvas));
  }, [note.position, pageViewport, canvasRef]);

  useEffect(() => {
    if (!editing) return;
    setText(note.note_text);
    setShowActions(true);
    const frame = requestAnimationFrame(() => {
      textareaRef.current?.focus();
      const el = textareaRef.current;
      if (el) {
        const len = el.value.length;
        el.setSelectionRange(len, len);
      }
    });
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, note.id]);

  useEffect(() => {
    if (editing) return;
    setText(note.note_text);
  }, [editing, note.note_text]);

  if (!localPos || !note.position) return null;

  function handleDragStart(e: ReactPointerEvent<HTMLElement>) {
    if (editing) return;
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
    const canvas = canvasRef.current;
    if (drag.dragging && canvas && note.position) {
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      const finalDisplay = {
        ...drag.origin,
        x: drag.origin.x + dx,
        y: drag.origin.y + dy,
      };
      setLocalPos(finalDisplay);
      onMove(note.id, pagePositionFromDisplay(finalDisplay, canvas, note.position));
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
    onFinish(note.id, text);
  }

  function handleBlur(e: React.FocusEvent<HTMLElement>) {
    if (!editing) return;
    const related = e.relatedTarget as Element | null;
    if (related && rootRef.current?.contains(related)) return;
    if (related?.closest("#note-toolbar")) return;
    handleFinish();
  }

  return (
    <div
      ref={rootRef}
      data-note-id={note.id}
      data-note-kind="comment"
      className="note-root group/comment absolute z-20"
      style={{
        left: localPos.x,
        top: localPos.y,
        width: localPos.width,
        minHeight: localPos.height,
        fontFamily: stickyNoteFontStack(),
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        if (!editing) setShowActions(false);
      }}
      dir={dir}
    >
      {(showActions || editing) && (
        <div className="absolute -top-8 left-0 z-30 flex items-center gap-1 rounded-lg border border-white/50 bg-white/90 px-1 py-0.5 shadow-sm backdrop-blur-sm">
          <button
            type="button"
            aria-label="Move comment"
            title="اسحب للنقل"
            className="flex h-6 w-6 cursor-grab items-center justify-center rounded text-[#5b4028]/80 active:cursor-grabbing hover:bg-[#fff1dc]"
            onPointerDown={handleDragStart}
            onPointerMove={handleDragMove}
            onPointerUp={handleDragEnd}
            onPointerCancel={handleDragEnd}
          >
            <svg viewBox="0 0 16 16" className="h-3 w-3" aria-hidden>
              <circle cx="5" cy="4" r="1.1" fill="currentColor" />
              <circle cx="11" cy="4" r="1.1" fill="currentColor" />
              <circle cx="5" cy="8" r="1.1" fill="currentColor" />
              <circle cx="11" cy="8" r="1.1" fill="currentColor" />
              <circle cx="5" cy="12" r="1.1" fill="currentColor" />
              <circle cx="11" cy="12" r="1.1" fill="currentColor" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Delete comment"
            title="حذف"
            className="flex h-6 w-6 items-center justify-center rounded text-red-600/80 hover:bg-red-50"
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
      )}

      <div
        className={cn(
          "relative rounded-lg bg-transparent",
          editing && "ring-1 ring-primary/35",
        )}
      >
        {/* Speech-bubble tip — distinguishes comments from sticky notes */}
        <span
          className="pointer-events-none absolute -left-1.5 top-2 text-primary/55"
          aria-hidden
        >
          <svg viewBox="0 0 12 12" className="h-3 w-3">
            <path
              d="M1 6c2.5-1 4-3.2 5.2-5.5L8 6H1z"
              fill="currentColor"
              opacity="0.35"
            />
          </svg>
        </span>

        {editing ? (
          <textarea
            ref={textareaRef}
            className="min-h-[52px] w-full resize-none rounded-lg bg-[rgba(255,248,241,0.35)] px-2.5 py-2 text-[13px] leading-snug text-[#2a1c12] outline-none placeholder:text-[#6f4528]/40"
            dir="auto"
            placeholder="اكتب تعليقاً..."
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              onDraftChange(note.id, e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                handleFinish();
              }
            }}
            onBlur={handleBlur}
          />
        ) : (
          <button
            type="button"
            className="block w-full rounded-lg bg-[rgba(255,248,241,0.28)] px-2.5 py-2 text-start text-[13px] leading-snug text-[#2a1c12] hover:bg-[rgba(255,248,241,0.45)]"
            dir="auto"
            onClick={(e) => {
              e.stopPropagation();
              if (isDraggingRef.current) return;
              onStartEdit(note.id);
            }}
          >
            {display || (
              <span className="text-[#6f4528]/40" dir="rtl">
                اضغط للكتابة
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
