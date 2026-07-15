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
 * Lightweight Arabic-friendly comment: one text field, drag to move, no sticky chrome.
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
      className="note-root absolute z-20"
      style={{
        left: localPos.x,
        top: localPos.y,
        width: localPos.width,
        minHeight: localPos.height,
        fontFamily: stickyNoteFontStack(),
      }}
      onPointerDown={(e) => e.stopPropagation()}
      dir={dir}
    >
      <div
        className={cn(
          "relative rounded-md border border-[#c9952a]/35 bg-[rgba(255,252,247,0.72)] shadow-[0_4px_14px_rgba(40,24,8,0.12)] backdrop-blur-[1.5px]",
          editing && "ring-1 ring-[#c9952a]/50",
        )}
      >
        <div className="flex items-center gap-1 border-b border-[#eadbc8]/60 px-1.5 py-0.5">
          <button
            type="button"
            aria-label="Move comment"
            title="اسحب للنقل"
            className="flex h-5 w-5 cursor-grab items-center justify-center rounded text-[#6f4528]/70 active:cursor-grabbing"
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
          <span className="flex-1 text-[10px] font-medium text-[#6f4528]/65">تعليق</span>
          <button
            type="button"
            aria-label="Delete comment"
            title="حذف"
            className="flex h-5 w-5 items-center justify-center rounded text-[#6f4528]/70 hover:bg-black/5"
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
          <textarea
            ref={textareaRef}
            className="min-h-[56px] w-full resize-none bg-transparent px-2.5 py-2 text-[13px] leading-snug text-[#2a1c12] outline-none placeholder:text-[#6f4528]/45"
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
            className="block w-full px-2.5 py-2 text-start text-[13px] leading-snug text-[#2a1c12]"
            dir="auto"
            onClick={(e) => {
              e.stopPropagation();
              if (isDraggingRef.current) return;
              onStartEdit(note.id);
            }}
          >
            {display || (
              <span className="text-[#6f4528]/45" dir="rtl">
                اضغط للكتابة
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
