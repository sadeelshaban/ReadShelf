"use client";

import {
  useEffect,
  useRef,
  useState,
  type FocusEvent as ReactFocusEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { Note, NotePosition } from "@/types";
import {
  displayCommentFromPagePosition,
  pageCommentPositionFromDisplay,
  type ViewportSize,
} from "@/lib/reader/coordinates";
import { DEFAULT_NOTE_FONT_SIZE } from "@/lib/reader/constants";
import {
  detectTextDirection,
  MAX_STICKY_NOTE_CHARS,
  stickyNoteFontStack,
} from "@/lib/reader/sticky-notes";
import { cn } from "@/lib/utils";

export type PageCommentProps = {
  note: Note;
  editing: boolean;
  liveFontSize?: number;
  /** Live CSS zoom preview on the pages layer (counter-scales text). */
  zoomPreview?: number;
  onFinish: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, position: NotePosition) => void;
  onStartEdit: (id: string) => void;
  onDraftChange: (id: string, text: string) => void;
  canvasRef: { current: HTMLCanvasElement | null };
  pageViewport: ViewportSize;
};

export function PageComment({
  note,
  editing,
  liveFontSize,
  zoomPreview = 1,
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
  const fontSize =
    editing && liveFontSize != null ? liveFontSize : (localPos?.fontSize ?? DEFAULT_NOTE_FONT_SIZE);
  const screenFontSize = fontSize / Math.max(zoomPreview, 0.0001);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !note.position || dragRef.current || isDraggingRef.current) return;
    setLocalPos(displayCommentFromPagePosition(note.position, canvas));
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

  function persistPosition(nextDisplay: {
    x: number;
    y: number;
    width: number;
    height: number;
    fontSize: number;
  }) {
    const canvas = canvasRef.current;
    if (!canvas || !note.position) return;
    setLocalPos(nextDisplay);
    onMove(note.id, pageCommentPositionFromDisplay(nextDisplay, canvas, note.position));
  }

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
    onFinish(note.id, text);
  }

  function handleBlur(e: ReactFocusEvent<HTMLElement>) {
    if (!editing) return;
    const related = e.relatedTarget as Element | null;
    if (related && rootRef.current?.contains(related)) return;
    if (related?.closest("#note-toolbar")) return;
    handleFinish();
  }

  function handleKeyDown(e: ReactKeyboardEvent<HTMLTextAreaElement>) {
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

  return (
    <div
      ref={rootRef}
      data-note-id={note.id}
      data-note-kind="comment"
      className="note-root group/comment absolute z-20 max-w-[min(360px,70vw)]"
      style={{
        left: localPos.x,
        top: localPos.y,
        fontFamily: stickyNoteFontStack(),
        fontSize: screenFontSize,
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
            title="Drag to move"
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
            title="Delete"
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
          "relative w-max max-w-full rounded-lg bg-transparent",
          editing && "ring-1 ring-primary/35",
        )}
      >
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
            className="min-h-[1.5em] w-[min(320px,65vw)] resize-none rounded-lg bg-[rgba(255,248,241,0.35)] px-2.5 py-2 leading-snug text-[#2a1c12] outline-none placeholder:text-[#6f4528]/40"
            style={{ fontSize: "inherit" }}
            dir="auto"
            maxLength={MAX_STICKY_NOTE_CHARS}
            placeholder="Write a comment..."
            value={text}
            onChange={(e) => {
              const value = e.target.value.slice(0, MAX_STICKY_NOTE_CHARS);
              setText(value);
              onDraftChange(note.id, value);
            }}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
          />
        ) : (
          <button
            type="button"
            className="block w-max max-w-full rounded-lg bg-[rgba(255,248,241,0.28)] px-2.5 py-2 text-start leading-snug text-[#2a1c12] hover:bg-[rgba(255,248,241,0.45)]"
            style={{ fontSize: "inherit" }}
            dir="auto"
            onClick={(e) => {
              e.stopPropagation();
              if (isDraggingRef.current) return;
              onStartEdit(note.id);
            }}
          >
            {display || (
              <span className="text-[#6f4528]/40">
                Click to write
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
