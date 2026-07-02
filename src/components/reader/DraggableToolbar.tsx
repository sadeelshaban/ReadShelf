"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { GripIcon } from "@/components/reader/ReaderIcons";
import { ReaderTooltip } from "@/components/reader/ReaderTooltip";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "readshelf-left-toolbar-pos";

type Position = { x: number; y: number };

function loadPosition(): Position | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Position;
    if (typeof parsed.x === "number" && typeof parsed.y === "number") return parsed;
  } catch {
    // ignore
  }
  return null;
}

function clampPosition(pos: Position): Position {
  const margin = 8;
  const width = 48;
  const height = 380;
  const maxX = Math.max(margin, window.innerWidth - width - margin);
  const maxY = Math.max(margin, window.innerHeight - height - margin);
  return {
    x: Math.min(maxX, Math.max(margin, pos.x)),
    y: Math.min(maxY, Math.max(margin, pos.y)),
  };
}

function snapXNearPage(pageWidth: number) {
  const margin = 8;
  const toolbarWidth = 48;
  return Math.max(margin, (window.innerWidth - pageWidth) / 2 - toolbarWidth - margin);
}

type DraggableToolbarProps = {
  id: string;
  children: ReactNode;
  className?: string;
  anchorPageWidth?: number | null;
};

export function DraggableToolbar({
  id,
  children,
  className,
  anchorPageWidth,
}: DraggableToolbarProps) {
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const userDraggedRef = useRef(false);

  const [position, setPosition] = useState<Position>({ x: 12, y: 120 });

  useEffect(() => {
    const saved = loadPosition();
    if (saved) {
      userDraggedRef.current = true;
      setPosition(clampPosition(saved));
      return;
    }

    const y = Math.max(12, Math.round(window.innerHeight / 2 - 140));
    const x = anchorPageWidth ? snapXNearPage(anchorPageWidth) : 12;
    setPosition(clampPosition({ x, y }));
  }, [anchorPageWidth]);

  useEffect(() => {
    if (userDraggedRef.current || !anchorPageWidth) return;
    setPosition((current) =>
      clampPosition({ x: snapXNearPage(anchorPageWidth), y: current.y }),
    );
  }, [anchorPageWidth]);

  const persist = useCallback((pos: Position) => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(pos));
  }, []);

  useEffect(() => {
    function onResize() {
      setPosition((current) => clampPosition(current));
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  function handleGripDown(e: ReactPointerEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: position.x,
      originY: position.y,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handleGripMove(e: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const next = clampPosition({
      x: drag.originX + (e.clientX - drag.startX),
      y: drag.originY + (e.clientY - drag.startY),
    });
    setPosition(next);
  }

  function handleGripUp(e: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    dragRef.current = null;
    userDraggedRef.current = true;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setPosition((current) => {
      const clamped = clampPosition(current);
      persist(clamped);
      return clamped;
    });
  }

  return (
    <aside
      id={id}
      style={{ left: position.x, top: position.y }}
      className={cn(
        "reader-toolbar-panel pointer-events-auto absolute z-20 flex w-12 flex-col items-center gap-1 rounded py-1.5",
        className,
      )}
    >
      <ReaderTooltip label="Drag to move toolbar" side="right">
        <div
          aria-label="Drag toolbar"
          className="reader-toolbar-grip mb-0.5"
          onPointerDown={handleGripDown}
          onPointerMove={handleGripMove}
          onPointerUp={handleGripUp}
          onPointerCancel={handleGripUp}
        >
          <GripIcon />
          <span className="text-[8px] font-medium uppercase tracking-wide opacity-70">Drag</span>
        </div>
      </ReaderTooltip>
      {children}
    </aside>
  );
}
