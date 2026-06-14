"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type {
  Highlight,
  HighlightStroke,
  Note,
  NotePosition,
  ReaderTool,
} from "@/types";
import { createClient } from "@/lib/supabase/client";
import {
  canvasPointFromClient,
  displayFontSizeFromLayout,
  displayRectFromPagePosition,
  pagePositionFromDisplay,
  scaleStroke,
  type ViewportSize,
} from "@/lib/reader/coordinates";
import {
  DEFAULT_NOTE_FONT_SIZE,
  HIGHLIGHT_PRESETS,
  HIGHLIGHT_DRAW_ALPHA,
  MAX_NOTE_FONT_SIZE,
  MIN_NOTE_FONT_SIZE,
  NOTE_TEXT_COLORS,
  hexToRgba,
  loadLastHighlightColor,
  loadRecentHighlightColors,
  noteTextCss,
  saveRecentHighlightColor,
} from "@/lib/reader/constants";
import { getPdfDocument } from "@/lib/pdf";
import {
  clearNoteText,
  deleteNote as deleteNoteApi,
  flushSyncQueue,
  insertNote,
  loadPdfBuffer,
  moveNote as moveNoteApi,
  saveHighlightStroke,
  saveReadingProgress,
  seedBookAnnotations,
  updateNoteColor as updateNoteColorApi,
  updateNoteFontSize as updateNoteFontSizeApi,
  updateNoteText,
} from "@/lib/offline/reader-api";
import { isOnline } from "@/lib/offline/online";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type PdfReaderProps = {
  bookId: string;
  userId: string;
  initialPage: number;
  totalPages: number | null;
  initialHighlights: Highlight[];
  initialNotes: Note[];
};

const STROKE_WIDTH = 28;
const SWIPE_THRESHOLD_PX = 48;
const WHEEL_NAV_THRESHOLD = 90;

function drawStroke(
  ctx: CanvasRenderingContext2D,
  stroke: HighlightStroke,
  colorHex: string,
) {
  if (stroke.points.length < 2) return;
  ctx.save();
  ctx.strokeStyle = hexToRgba(colorHex, HIGHLIGHT_DRAW_ALPHA);
  ctx.lineWidth = stroke.width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.globalCompositeOperation = "multiply";
  ctx.beginPath();
  ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
  for (let i = 1; i < stroke.points.length; i++) {
    ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
  }
  ctx.stroke();
  ctx.restore();
}

function redrawHighlightLayer(
  canvas: HTMLCanvasElement,
  highlights: Highlight[],
  page: number,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  highlights
    .filter((h) => h.page_number === page)
    .forEach((highlight) => {
      const color = highlight.color || HIGHLIGHT_PRESETS[0].value;
      const refW = highlight.position?.viewportWidth ?? canvas.width;
      const refH = highlight.position?.viewportHeight ?? canvas.height;
      highlight.position?.strokes?.forEach((stroke) => {
        const scaled = scaleStroke(stroke, refW, refH, canvas.width, canvas.height);
        drawStroke(ctx, scaled, color);
      });
    });
}

function isTouchDevice() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0
  );
}

function touchDistance(touches: TouchList) {
  if (touches.length < 2) return 0;
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.hypot(dx, dy);
}

type PageNoteProps = {
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
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  canvasDisplayWidth: number;
  pageViewport: ViewportSize;
};

function PageNote({
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
    if (!canvas || !note.position || dragRef.current) return;
    setLocalPos(displayRectFromPagePosition(note.position, canvas));
  }, [note.position, pageViewport, canvasRef]);

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
    const canvas = canvasRef.current;
    if (dragRef.current.dragging && localPos && canvas) {
      onMove(
        note.id,
        pagePositionFromDisplay(
          {
            x: localPos.x,
            y: localPos.y,
            width: localPos.width,
            height: localPos.height,
            fontSize: note.position?.fontSize,
          },
          canvas,
          note.position,
        ),
      );
    }
    dragRef.current = null;
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
        placeholder="Write your message"
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

export function PdfReader({
  bookId,
  userId,
  initialPage,
  totalPages,
  initialHighlights,
  initialNotes,
}: PdfReaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawLayerRef = useRef<HTMLCanvasElement>(null);
  const pdfRef = useRef<Awaited<ReturnType<typeof getPdfDocument>> | null>(null);
  const currentStrokeRef = useRef<HighlightStroke | null>(null);
  const isDrawingRef = useRef(false);
  const highlightsRef = useRef(initialHighlights);
  const editingDraftRef = useRef("");
  const noteHadContentRef = useRef(false);
  const finishNoteRef = useRef<(id: string, text: string) => void>(() => {});
  const swipeRef = useRef<{
    startX: number;
    startY: number;
    pointerId: number;
  } | null>(null);
  const toolRef = useRef<ReaderTool>("read");
  const editingNoteIdRef = useRef<string | null>(null);
  const maxPageRef = useRef(initialPage);
  const goToPrevPageRef = useRef<() => void>(() => {});
  const goToNextPageRef = useRef<() => void>(() => {});
  const viewerRef = useRef<HTMLDivElement>(null);

  const [page, setPage] = useState(initialPage);
  const [scale, setScale] = useState(1.35);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tool, setTool] = useState<ReaderTool>("read");
  const [highlights, setHighlights] = useState(initialHighlights);
  const [notes, setNotes] = useState(initialNotes);
  const [message, setMessage] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteMenuId, setNoteMenuId] = useState<string | null>(null);
  const [noteTextColor, setNoteTextColor] = useState("black");
  const [noteFontSize, setNoteFontSize] = useState(DEFAULT_NOTE_FONT_SIZE);
  const [highlightColor, setHighlightColor] = useState(loadLastHighlightColor);
  const [recentColors, setRecentColors] = useState(loadRecentHighlightColors);
  const [isTouch] = useState(isTouchDevice);
  const [offline, setOffline] = useState(() => !isOnline());
  const [canvasDisplayWidth, setCanvasDisplayWidth] = useState(0);
  const [pageViewport, setPageViewport] = useState<ViewportSize>({
    width: 0,
    height: 0,
  });

  highlightsRef.current = highlights;
  toolRef.current = tool;
  editingNoteIdRef.current = editingNoteId;

  const maxPage = totalPages ?? pdfRef.current?.numPages ?? page;
  maxPageRef.current = maxPage;

  const goToPrevPage = useCallback(() => {
    setPage((current) => Math.max(1, current - 1));
  }, []);

  const goToNextPage = useCallback(() => {
    setPage((current) => Math.min(maxPageRef.current, current + 1));
  }, []);

  goToPrevPageRef.current = goToPrevPage;
  goToNextPageRef.current = goToNextPage;

  function canNavigatePages() {
    return (
      toolRef.current === "read" &&
      !editingNoteIdRef.current &&
      !isDrawingRef.current
    );
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }
      if (!canNavigatePages()) return;
      e.preventDefault();
      if (e.key === "ArrowLeft") goToPrevPageRef.current();
      else goToNextPageRef.current();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    let wheelDeltaX = 0;

    function onWheel(e: WheelEvent) {
      if (!canNavigatePages()) return;
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;

      wheelDeltaX += e.deltaX;
      if (Math.abs(wheelDeltaX) < WHEEL_NAV_THRESHOLD) return;

      e.preventDefault();
      if (wheelDeltaX > 0) goToNextPageRef.current();
      else goToPrevPageRef.current();
      wheelDeltaX = 0;
    }

    viewer.addEventListener("wheel", onWheel, { passive: false });
    return () => viewer.removeEventListener("wheel", onWheel);
  }, []);

  useEffect(() => {
    function handleConnectivityChange() {
      setOffline(!isOnline());
      if (isOnline()) {
        void flushSyncQueue();
      }
    }

    window.addEventListener("online", handleConnectivityChange);
    window.addEventListener("offline", handleConnectivityChange);
    return () => {
      window.removeEventListener("online", handleConnectivityChange);
      window.removeEventListener("offline", handleConnectivityChange);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      setCanvasDisplayWidth(width);
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [loading, page, scale]);

  useEffect(() => {
    if (!editingNoteId || isTouch) return;
    const noteId = editingNoteId;

    function handleOutsidePointerDown(e: PointerEvent) {
      const target = e.target as Element;
      if (target.closest(".note-root") || target.closest("#note-toolbar")) return;
      finishNoteRef.current(noteId, editingDraftRef.current);
    }

    window.addEventListener("pointerdown", handleOutsidePointerDown);
    return () => window.removeEventListener("pointerdown", handleOutsidePointerDown);
  }, [editingNoteId, isTouch]);

  const pageNotes = notes.filter((n) => n.page_number === page);

  const saveProgress = useCallback(
    async (currentPage: number) => {
      await saveReadingProgress(bookId, currentPage, totalPages);
    },
    [bookId, totalPages],
  );

  const renderPage = useCallback(async (pageNumber: number, zoom: number) => {
    const pdf = pdfRef.current;
    const canvas = canvasRef.current;
    const drawLayer = drawLayerRef.current;
    if (!pdf || !canvas || !drawLayer) return;

    const pdfPage = await pdf.getPage(pageNumber);
    const viewport = pdfPage.getViewport({ scale: zoom });
    const context = canvas.getContext("2d");
    if (!context) return;

    canvas.width = viewport.width;
    canvas.height = viewport.height;
    drawLayer.width = viewport.width;
    drawLayer.height = viewport.height;

    setPageViewport({ width: viewport.width, height: viewport.height });

    await pdfPage.render({ canvasContext: context, viewport, canvas }).promise;
    redrawHighlightLayer(drawLayer, highlightsRef.current, pageNumber);
  }, []);

  useEffect(() => {
    let active = true;

    async function init() {
      try {
        setLoading(true);
        setError(null);
        const local = await seedBookAnnotations(
          bookId,
          initialHighlights,
          initialNotes,
        );
        setHighlights(local.highlights);
        setNotes(local.notes);
        const buffer = await loadPdfBuffer(bookId);
        const pdf = await getPdfDocument(buffer);
        if (!active) {
          await pdf.cleanup();
          return;
        }
        pdfRef.current = pdf;
        await renderPage(initialPage, 1.35);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load PDF");
        setLoading(false);
      }
    }

    init();
    return () => {
      active = false;
      pdfRef.current?.cleanup();
      pdfRef.current = null;
    };
  }, [bookId, initialHighlights, initialNotes, initialPage, renderPage]);

  useEffect(() => {
    if (!pdfRef.current) return;
    renderPage(page, scale).catch((err) => {
      setError(err instanceof Error ? err.message : "Failed to render page");
    });
  }, [page, scale, renderPage]);

  useEffect(() => {
    const drawLayer = drawLayerRef.current;
    if (drawLayer) redrawHighlightLayer(drawLayer, highlights, page);
  }, [highlights, page]);

  useEffect(() => {
    const timer = setTimeout(() => saveProgress(page), 500);
    return () => clearTimeout(timer);
  }, [page, saveProgress]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`reader-${bookId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "highlights", filter: `book_id=eq.${bookId}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setHighlights((prev) => {
              const row = payload.new as Highlight;
              if (prev.some((h) => h.id === row.id)) return prev;
              return [...prev, row];
            });
          }
          if (payload.eventType === "DELETE") {
            setHighlights((prev) =>
              prev.filter((h) => h.id !== (payload.old as Highlight).id),
            );
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notes", filter: `book_id=eq.${bookId}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setNotes((prev) => {
              const row = payload.new as Note;
              if (prev.some((n) => n.id === row.id)) return prev;
              return [...prev, row];
            });
          }
          if (payload.eventType === "UPDATE") {
            setNotes((prev) =>
              prev.map((n) =>
                n.id === (payload.new as Note).id ? (payload.new as Note) : n,
              ),
            );
          }
          if (payload.eventType === "DELETE") {
            setNotes((prev) =>
              prev.filter((n) => n.id !== (payload.old as Note).id),
            );
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookId]);

  function commitHighlightColor(color: string) {
    const saved = saveRecentHighlightColor(color);
    setHighlightColor(saved);
    setRecentColors(loadRecentHighlightColors());
  }

  function pickHighlightColor(color: string) {
    commitHighlightColor(color);
  }

  function startEditingNote(id: string) {
    const note = notes.find((entry) => entry.id === id);
    if (note) {
      setNoteTextColor(note.text_color ?? "black");
      setNoteFontSize(note.position?.fontSize ?? DEFAULT_NOTE_FONT_SIZE);
      editingDraftRef.current = note.note_text;
      noteHadContentRef.current = note.note_text.trim().length > 0;
    }
    setEditingNoteId(id);
  }

  function syncNoteDraft(id: string, text: string) {
    if (editingNoteId === id) {
      editingDraftRef.current = text;
      if (text.trim().length > 0) {
        noteHadContentRef.current = true;
      }
    }
  }

  function pickNoteColor(color: string) {
    setNoteTextColor(color);
    if (editingNoteId) {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === editingNoteId ? { ...n, text_color: color } : n,
        ),
      );
      void updateNoteColor(editingNoteId, color);
    }
  }

  function applyNoteFontSize(size: number) {
    const next = Math.min(
      MAX_NOTE_FONT_SIZE,
      Math.max(MIN_NOTE_FONT_SIZE, Math.round(size)),
    );
    setNoteFontSize(next);
    if (!editingNoteId) return;

    setNotes((prev) => {
      const note = prev.find((entry) => entry.id === editingNoteId);
      if (note?.position) {
        void updateNoteFontSize(editingNoteId, { ...note.position, fontSize: next });
      }
      return prev.map((n) => {
        if (n.id !== editingNoteId || !n.position) return n;
        return { ...n, position: { ...n.position, fontSize: next } };
      });
    });
  }

  function adjustNoteFontSize(delta: number) {
    applyNoteFontSize(noteFontSize + delta);
  }

  function getViewportSize() {
    const canvas = drawLayerRef.current;
    if (!canvas) return null;
    return { viewportWidth: canvas.width, viewportHeight: canvas.height };
  }

  async function saveStroke(stroke: HighlightStroke) {
    const viewport = getViewportSize();
    try {
      const data = await saveHighlightStroke({
        bookId,
        userId,
        pageNumber: page,
        color: highlightColor,
        stroke,
        viewport: viewport ?? {},
      });
      pickHighlightColor(highlightColor);
      setHighlights((prev) => {
        if (prev.some((entry) => entry.id === data.id)) return prev;
        return [...prev, data];
      });
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not save highlight");
    }
  }

  function getCanvasPoint(e: ReactPointerEvent<HTMLCanvasElement>) {
    return canvasPointFromClient(e.clientX, e.clientY, e.currentTarget);
  }

  function handleDrawPointerDown(e: ReactPointerEvent<HTMLCanvasElement>) {
    if (tool !== "highlight") return;
    isDrawingRef.current = true;
    const point = getCanvasPoint(e);
    currentStrokeRef.current = { points: [point], width: STROKE_WIDTH };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handleDrawPointerMove(e: ReactPointerEvent<HTMLCanvasElement>) {
    if (!isDrawingRef.current || tool !== "highlight") return;
    const stroke = currentStrokeRef.current;
    const canvas = drawLayerRef.current;
    const ctx = canvas?.getContext("2d");
    if (!stroke || !canvas || !ctx) return;

    const point = getCanvasPoint(e);
    const last = stroke.points[stroke.points.length - 1];
    stroke.points.push(point);

    ctx.save();
    ctx.strokeStyle = hexToRgba(highlightColor, HIGHLIGHT_DRAW_ALPHA);
    ctx.lineWidth = stroke.width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalCompositeOperation = "multiply";
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    ctx.restore();
  }

  async function handleDrawPointerUp(e: ReactPointerEvent<HTMLCanvasElement>) {
    if (!isDrawingRef.current || tool !== "highlight") return;
    isDrawingRef.current = false;
    const stroke = currentStrokeRef.current;
    currentStrokeRef.current = null;

    const canvas = e.currentTarget ?? drawLayerRef.current;
    if (canvas?.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }

    if (stroke && stroke.points.length > 1) {
      await saveStroke(stroke);
    }
  }

  async function handlePageClick(e: ReactPointerEvent<HTMLDivElement>) {
    if (tool !== "note" || editingNoteId) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const point = canvasPointFromClient(e.clientX, e.clientY, canvas);
    const position: NotePosition = {
      x: Math.max(8, point.x - 20),
      y: Math.max(8, point.y - 20),
      width: 220,
      height: 120,
      fontSize: noteFontSize,
      viewportWidth: canvas.width,
      viewportHeight: canvas.height,
    };

    try {
      const data = await insertNote({
        bookId,
        userId,
        pageNumber: page,
        position,
        textColor: noteTextColor,
      });
      setNotes((prev) => [...prev, data]);
      editingDraftRef.current = "";
      noteHadContentRef.current = false;
      setEditingNoteId(data.id);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not add note");
    }
  }

  function handleContainerPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (tool === "note" && !editingNoteId) {
      void handlePageClick(e);
      return;
    }
    if (!canNavigatePages()) return;
    if (e.pointerType === "mouse") return;
    swipeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      pointerId: e.pointerId,
    };
  }

  function handleContainerPointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    if (!swipeRef.current || swipeRef.current.pointerId !== e.pointerId) return;

    const { startX, startY } = swipeRef.current;
    swipeRef.current = null;
    if (!canNavigatePages()) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (Math.abs(dx) < SWIPE_THRESHOLD_PX || Math.abs(dy) > Math.abs(dx)) return;

    if (dx < 0) goToNextPage();
    else goToPrevPage();
  }

  async function finishNote(id: string, text: string) {
    const trimmed = text.trim();
    if (!trimmed) {
      if (!noteHadContentRef.current) {
        await deleteNote(id);
        return;
      }

      await clearNoteText(id);
      setNotes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, note_text: "" } : n)),
      );
      setEditingNoteId(null);
      setTool("read");
      setNoteMenuId(null);
      return;
    }

    await updateNoteText(id, trimmed);
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, note_text: trimmed } : n)),
    );
    setEditingNoteId(null);
    setTool("read");
    setNoteMenuId(null);
  }

  finishNoteRef.current = finishNote;

  async function updateNoteColor(id: string, color: string) {
    await updateNoteColorApi(id, color);
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, text_color: color } : n)),
    );
  }

  async function updateNoteFontSize(id: string, position: NotePosition) {
    await updateNoteFontSizeApi(id, position);
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, position } : n)),
    );
  }

  async function moveNote(id: string, position: NotePosition) {
    await moveNoteApi(id, position);
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, position } : n)),
    );
  }

  async function deleteNote(id: string) {
    await deleteNoteApi(id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (editingNoteId === id) setEditingNoteId(null);
    setNoteMenuId((current) => (current === id ? null : current));
    setTool("read");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-soft-gray/30 bg-card p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="secondary" onClick={goToPrevPage} disabled={page <= 1}>
              Prev
            </Button>
            <form
              className="flex items-center gap-1"
              onSubmit={(e) => {
                e.preventDefault();
                const input = (e.currentTarget.elements.namedItem("page") as HTMLInputElement);
                const value = Number.parseInt(input.value, 10);
                if (Number.isFinite(value)) setPage(Math.min(maxPage, Math.max(1, value)));
              }}
            >
              <input name="page" type="number" min={1} max={maxPage} defaultValue={page} key={page} className="w-16 rounded-lg border border-soft-gray/50 bg-background px-2 py-1.5 text-sm" />
              <span className="text-sm">/ {maxPage}</span>
            </form>
            <Button size="sm" variant="secondary" onClick={goToNextPage} disabled={page >= maxPage}>
              Next
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setScale((s) => Math.max(0.8, s - 0.2))}>Zoom −</Button>
            <Button size="sm" variant="secondary" onClick={() => setScale((s) => Math.min(2.5, s + 0.2))}>Zoom +</Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant={tool === "highlight" ? "primary" : "secondary"} onClick={() => setTool(tool === "highlight" ? "read" : "highlight")}>
              Highlighter
            </Button>
            <Button size="sm" variant={tool === "note" ? "primary" : "secondary"} onClick={() => setTool(tool === "note" ? "read" : "note")}>
              Add Note
            </Button>
          </div>
        </div>

        {tool === "highlight" && (
          <div className="flex flex-wrap items-center gap-2 border-t border-soft-gray/20 pt-3">
            <span className="text-xs font-medium text-text/70">Highlighter color:</span>
            {HIGHLIGHT_PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                title={preset.name}
                className={cn(
                  "h-7 w-7 rounded-full border-2 transition hover:scale-110",
                  highlightColor.toLowerCase() === preset.value.toLowerCase()
                    ? "border-primary ring-2 ring-primary/30"
                    : "border-soft-gray/40",
                )}
                style={{ backgroundColor: preset.value }}
                onClick={() => pickHighlightColor(preset.value)}
              />
            ))}
            {recentColors.map((color, index) => (
              <button
                key={`${index}-${color}`}
                type="button"
                title="Recent color"
                className={cn(
                  "h-7 w-7 rounded-full border-2 transition hover:scale-110",
                  highlightColor.toLowerCase() === color.toLowerCase()
                    ? "border-primary ring-2 ring-primary/30"
                    : "border-soft-gray/40",
                )}
                style={{ backgroundColor: color }}
                onClick={() => pickHighlightColor(color)}
              />
            ))}
            <label className="flex items-center gap-1 text-xs text-text/70">
              Custom
              <input
                type="color"
                value={highlightColor}
                onChange={(e) => setHighlightColor(e.target.value)}
                onBlur={(e) => commitHighlightColor(e.target.value)}
                className="h-7 w-10 cursor-pointer rounded border border-soft-gray/40 bg-transparent"
              />
            </label>
          </div>
        )}

        {(tool === "note" || editingNoteId) && (
          <div
            id="note-toolbar"
            className="flex flex-wrap items-center gap-2 border-t border-soft-gray/20 pt-3"
            onMouseDown={(e) => e.preventDefault()}
          >
            <span className="text-xs font-medium text-text/70">Note color:</span>
            {NOTE_TEXT_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                title={c.name}
                className={cn(
                  "h-7 w-7 rounded-full border-2 transition hover:scale-110",
                  noteTextColor === c.value
                    ? "border-primary ring-2 ring-primary/30"
                    : "border-soft-gray/40",
                )}
                style={{ backgroundColor: c.css }}
                onClick={() => pickNoteColor(c.value)}
              />
            ))}
            <span className="text-xs font-medium text-text/70">Text size:</span>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => adjustNoteFontSize(-2)}
              disabled={noteFontSize <= MIN_NOTE_FONT_SIZE}
            >
              A−
            </Button>
            <span className="min-w-[2.5rem] text-center text-xs tabular-nums text-text/70">
              {noteFontSize}px
            </span>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => adjustNoteFontSize(2)}
              disabled={noteFontSize >= MAX_NOTE_FONT_SIZE}
            >
              A+
            </Button>
          </div>
        )}
      </div>

      {tool === "highlight" && (
        <p className="rounded-lg bg-accent/15 px-3 py-2 text-sm text-text">
          Draw on the page. Pick a preset or choose an exact shade with Custom.
        </p>
      )}

      {tool === "note" && !editingNoteId && (
        <p className="rounded-lg bg-accent/15 px-3 py-2 text-sm text-text">
          Click anywhere on the page to place a note.
        </p>
      )}

      {editingNoteId && (
        <p className="rounded-lg bg-accent/15 px-3 py-2 text-sm text-text">
          Write your message.
          {isTouch
            ? " Pinch with two fingers to resize text. Dismiss the keyboard to save."
            : " Press Enter to save. Shift+Enter for a new line."}
          {" "}Blank new notes disappear if you tap elsewhere without typing.
        </p>
      )}

      {offline && (
        <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-800">
          Offline mode — read, highlight, and take notes. Progress, notes, and
          highlights sync when you are back online.
        </p>
      )}

      {message && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{message}</p>
      )}

      <div
        ref={viewerRef}
        className="overflow-auto rounded-xl border border-soft-gray/30 bg-[#ddd6c8] p-4"
      >
        {loading && <p className="text-sm text-text/70">Loading PDF...</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div
          ref={containerRef}
          className={cn(
            "relative mx-auto w-fit",
            tool === "note" && !editingNoteId && "cursor-crosshair",
          )}
          style={{ visibility: loading ? "hidden" : "visible" }}
          onPointerDown={handleContainerPointerDown}
          onPointerUp={handleContainerPointerUp}
          onPointerCancel={() => {
            swipeRef.current = null;
          }}
        >
          <canvas ref={canvasRef} className="block shadow-md" />
          <canvas
            ref={drawLayerRef}
            className={cn(
              "absolute left-0 top-0 touch-none",
              tool === "highlight" ? "cursor-crosshair" : "pointer-events-none",
            )}
            onPointerDown={handleDrawPointerDown}
            onPointerMove={handleDrawPointerMove}
            onPointerUp={handleDrawPointerUp}
            onPointerLeave={handleDrawPointerUp}
          />
          {pageNotes.map((note) => (
            <PageNote
              key={
                editingNoteId === note.id ? `${note.id}:edit` : note.id
              }
              note={note}
              editing={editingNoteId === note.id}
              showMenu={noteMenuId === note.id}
              isTouch={isTouch}
              liveFontSize={
                editingNoteId === note.id ? noteFontSize : undefined
              }
              liveTextColor={
                editingNoteId === note.id ? noteTextColor : undefined
              }
              onFinish={finishNote}
              onDelete={deleteNote}
              onMove={moveNote}
              onStartEdit={startEditingNote}
              onShowMenu={setNoteMenuId}
              onFontSizeChange={applyNoteFontSize}
              onDraftChange={syncNoteDraft}
              canvasRef={canvasRef}
              canvasDisplayWidth={canvasDisplayWidth}
              pageViewport={pageViewport}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
