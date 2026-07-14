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
import {
  DEFAULT_NOTE_FONT_SIZE,
  MAX_NOTE_FONT_SIZE,
  MIN_NOTE_FONT_SIZE,
  noteTextCss,
} from "@/lib/reader/constants";
import { touchDistance } from "@/lib/reader/pdf-reader-dom";
import { cn } from "@/lib/utils";

const NOTE_PLACEHOLDER = "Write a message";

export type PageNoteProps = {
  note: Note;
  editing: boolean;
  showMenu: boolean;
  isTouch: boolean;
  liveFontSize?: number;
  liveTextColor?: string;
  onFinish: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, position: NotePosition) => void;
  onStartEdit: (id: string) => void;
  onShowMenu: (id: string | null) => void;
  onFontSizeChange: (size: number) => void;
  onDraftChange: (id: string, text: string) => void;
  canvasRef: { current: HTMLCanvasElement | null };
  canvasDisplayWidth: number;
  pageViewport: ViewportSize;
};

export function PageNote({
  note,
  editing,
  showMenu: _showMenu,
  isTouch: _isTouch,
  liveFontSize,
  liveTextColor,
  onFinish,
  onDelete,
  onMove,
  onStartEdit,
  onShowMenu,
  onFontSizeChange,
  onDraftChange,
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
  const pinchRef = useRef<{ distance: number; fontSize: number } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const noteRootRef = useRef<HTMLDivElement>(null);
  const onFontSizeChangeRef = useRef(onFontSizeChange);
  const [localPos, setLocalPos] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
    fontSize: number;
  } | null>(null);
  const [text, setText] = useState(note.note_text);
  const textColor = liveTextColor ?? note.text_color ?? "black";
  const displayText = note.note_text.trim();

  useEffect(() => {
    onFontSizeChangeRef.current = onFontSizeChange;
  }, [onFontSizeChange]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !note.position || dragRef.current || isDraggingRef.current) return;
    setLocalPos(displayRectFromPagePosition(note.position, canvas));
  }, [note.position, pageViewport, canvasRef]);

  // Only seed local text when entering edit for this note — never while typing.
  useEffect(() => {
    if (!editing) return;
    setText(note.note_text);
    const frame = requestAnimationFrame(() => textareaRef.current?.focus());
    return () => cancelAnimationFrame(frame);
    // intentionally ignore note.note_text while editing
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, note.id]);

  useEffect(() => {
    if (editing) return;
    setText(note.note_text);
  }, [editing, note.note_text]);

  useEffect(() => {
    const root = noteRootRef.current;
    if (!root || !editing) return;

    function onTouchMove(e: TouchEvent) {
      if (!pinchRef.current || e.touches.length !== 2) return;
      e.preventDefault();
      const distance = touchDistance(e.touches);
      if (distance <= 0 || pinchRef.current.distance <= 0) return;
      const scale = distance / pinchRef.current.distance;
      const next = Math.min(
        MAX_NOTE_FONT_SIZE,
        Math.max(
          MIN_NOTE_FONT_SIZE,
          Math.round(pinchRef.current.fontSize * scale),
        ),
      );
      onFontSizeChangeRef.current(next);
    }

    root.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => root.removeEventListener("touchmove", onTouchMove);
  }, [editing]);

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
    const canvas = canvasRef.current;

    if (drag.dragging && canvas) {
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      const finalDisplay = {
        x: drag.origin.x + dx,
        y: drag.origin.y + dy,
        width: drag.origin.width,
        height: drag.origin.height,
        fontSize: drag.origin.fontSize,
      };
      setLocalPos(finalDisplay);
      onMove(
        note.id,
        pagePositionFromDisplay(finalDisplay, canvas, note.position),
      );
    }

    dragRef.current = null;
    isDraggingRef.current = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }

  function handleTextChange(value: string) {
    setText(value);
    onDraftChange(note.id, value);
  }

  function handleFinish() {
    onFinish(note.id, text);
  }

  function handleBlur(e: React.FocusEvent<HTMLTextAreaElement>) {
    if (!editing) return;
    const related = e.relatedTarget as Element | null;
    if (related?.closest("#note-toolbar")) return;
    if (related && noteRootRef.current?.contains(related)) return;
    // On desktop, blur saves; on touch, same — click-outside in parent still works.
    handleFinish();
  }

  function handleTouchStart(e: React.TouchEvent<HTMLDivElement>) {
    if (!editing || e.touches.length !== 2) return;
    pinchRef.current = {
      distance: touchDistance(e.nativeEvent.touches),
      fontSize: liveFontSize ?? note.position?.fontSize ?? DEFAULT_NOTE_FONT_SIZE,
    };
  }

  function handleTouchEnd() {
    pinchRef.current = null;
  }

  const textStyle = {
    color: noteTextCss(textColor),
    fontSize,
  };

  return (
    <div
      ref={noteRootRef}
      data-note-id={note.id}
      className="note-root absolute z-10 min-w-[180px] rounded-md bg-transparent p-1"
      style={{
        left: localPos.x,
        top: localPos.y,
        width: localPos.width,
        minHeight: localPos.height,
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {!editing && (
        <div className="mb-1 flex items-center gap-1">
          <button
            type="button"
            aria-label="Move note"
            title="Drag to move"
            className="flex h-6 w-6 cursor-grab items-center justify-center rounded bg-card/90 text-[var(--reader-text-muted)] shadow-sm active:cursor-grabbing"
            onPointerDown={handleDragStart}
            onPointerMove={handleDragMove}
            onPointerUp={handleDragEnd}
            onPointerCancel={handleDragEnd}
          >
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
              <circle cx="5" cy="4" r="1.15" fill="currentColor" />
              <circle cx="11" cy="4" r="1.15" fill="currentColor" />
              <circle cx="5" cy="8" r="1.15" fill="currentColor" />
              <circle cx="11" cy="8" r="1.15" fill="currentColor" />
              <circle cx="5" cy="12" r="1.15" fill="currentColor" />
              <circle cx="11" cy="12" r="1.15" fill="currentColor" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Edit note"
            title="Edit"
            className="rounded bg-card/90 px-2 py-0.5 text-[11px] text-primary shadow-sm"
            onClick={(e) => {
              e.stopPropagation();
              onShowMenu(null);
              onStartEdit(note.id);
            }}
          >
            Edit
          </button>
          <button
            type="button"
            aria-label="Delete note"
            title="Delete"
            className="rounded bg-card/90 px-2 py-0.5 text-[11px] text-red-600 shadow-sm"
            onClick={(e) => {
              e.stopPropagation();
              onShowMenu(null);
              onDelete(note.id);
            }}
          >
            Delete
          </button>
        </div>
      )}

      {editing ? (
        <textarea
          ref={textareaRef}
          className="min-h-[72px] w-full resize-none bg-transparent outline-none leading-snug"
          style={{
            ...textStyle,
            touchAction: "none",
          }}
          dir="auto"
          placeholder={NOTE_PLACEHOLDER}
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleFinish();
            }
            if (e.key === "Escape") {
              e.preventDefault();
              handleFinish();
            }
          }}
          onBlur={handleBlur}
        />
      ) : (
        <div
          className={cn(
            "min-h-[72px] w-full select-none whitespace-pre-wrap break-words leading-snug",
            !displayText && "text-black/35",
          )}
          style={textStyle}
          dir="auto"
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            if (isDraggingRef.current) return;
            onStartEdit(note.id);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onStartEdit(note.id);
            }
          }}
        >
          {displayText || NOTE_PLACEHOLDER}
        </div>
      )}
    </div>
  );
}
