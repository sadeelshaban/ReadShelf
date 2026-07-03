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
  showMenu,
  isTouch,
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

  useEffect(() => {
    onFontSizeChangeRef.current = onFontSizeChange;
  }, [onFontSizeChange]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !note.position || dragRef.current || isDraggingRef.current) return;
    setLocalPos(displayRectFromPagePosition(note.position, canvas));
  }, [note.position, pageViewport, canvasRef]);

  useEffect(() => {
    if (!editing) {
      setText(note.note_text);
    }
  }, [note.note_text, editing]);

  useEffect(() => {
    if (editing) textareaRef.current?.focus();
  }, [editing]);

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
    if (editing) onDraftChange(note.id, value);
  }

  function handleFinish() {
    onFinish(note.id, text);
  }

  function handleBlur(e: React.FocusEvent<HTMLTextAreaElement>) {
    if (!editing || !isTouch) return;
    const related = e.relatedTarget as Element | null;
    if (related?.closest("#note-toolbar")) return;
    if (related && noteRootRef.current?.contains(related)) return;
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
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (editing) return;
        if (isTouch) {
          onStartEdit(note.id);
        } else {
          onShowMenu(showMenu ? null : note.id);
        }
      }}
    >
      {showMenu && !isTouch && (
        <div className="mb-2 flex gap-2 rounded-md bg-card/95 px-2 py-1 shadow-sm">
          <button
            type="button"
            className="text-xs text-primary underline"
            onClick={() => {
              onStartEdit(note.id);
              onShowMenu(null);
            }}
          >
            Edit
          </button>
          <button
            type="button"
            className="text-xs text-red-600 underline"
            onClick={() => {
              onDelete(note.id);
              onShowMenu(null);
            }}
          >
            Delete
          </button>
        </div>
      )}

      <textarea
        ref={textareaRef}
        className={cn(
          "min-h-[72px] w-full resize-none bg-transparent outline-none leading-snug",
          !editing && "cursor-grab select-none active:cursor-grabbing",
        )}
        style={{
          color: noteTextCss(textColor),
          fontSize,
          touchAction: editing ? "none" : "auto",
        }}
        dir="auto"
        placeholder="Write a message"
        value={text}
        readOnly={!editing}
        onChange={(e) => {
          if (editing) handleTextChange(e.target.value);
        }}
        onKeyDown={(e) => {
          if (editing && e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleFinish();
          }
        }}
        onPointerDown={handleDragStart}
        onPointerMove={handleDragMove}
        onPointerUp={handleDragEnd}
        onBlur={handleBlur}
      />
    </div>
  );
}
