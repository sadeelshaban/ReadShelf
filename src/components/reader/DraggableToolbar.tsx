"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
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
  const width = 44;
  const height = 280;
  const maxX = Math.max(margin, window.innerWidth - width - margin);
  const maxY = Math.max(margin, window.innerHeight - height - margin);
  return {
    x: Math.min(maxX, Math.max(margin, pos.x)),
    y: Math.min(maxY, Math.max(margin, pos.y)),
  };
}

type DraggableToolbarProps = {
  id: string;
  children: ReactNode;
  className?: string;
};

export function DraggableToolbar({ id, children, className }: DraggableToolbarProps) {
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  const [position, setPosition] = useState<Position>({ x: 12, y: 120 });

  useEffect(() => {
    const saved = loadPosition();
    setPosition(
      saved ?? clampPosition({ x: 12, y: Math.max(12, Math.round(window.innerHeight / 2 - 140)) }),
    );
  }, []);

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
        "acrobat-toolbar pointer-events-auto absolute z-20 flex w-11 flex-col items-center gap-0.5 rounded py-1",
        className,
      )}
    >
      <div
        title="Drag toolbar"
        aria-label="Drag toolbar"
        className="mb-0.5 flex h-4 w-full cursor-grab items-center justify-center rounded active:cursor-grabbing"
        onPointerDown={handleGripDown}
        onPointerMove={handleGripMove}
        onPointerUp={handleGripUp}
        onPointerCancel={handleGripUp}
      >
        <span className="h-0.5 w-4 rounded-full bg-white/35" />
      </div>
      {children}
    </aside>
  );
}
