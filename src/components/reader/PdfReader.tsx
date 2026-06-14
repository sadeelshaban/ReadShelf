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
import {
  findHighlightAtPoint,
  findNoteAtPoint,
} from "@/lib/reader/hit-test";
import { getPdfDocument } from "@/lib/pdf";
import {
  clearNoteText,
  deleteHighlight as deleteHighlightApi,
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
import { LeftToolbar, RightToolbar } from "@/components/reader/ReaderToolbars";
import { ReaderTopBar } from "@/components/reader/ReaderTopBar";
import { cn } from "@/lib/utils";

type PdfReaderProps = {
  bookId: string;
  bookTitle: string;
  userId: string;
  initialPage: number;
  totalPages: number | null;
  initialHighlights: Highlight[];
  initialNotes: Note[];
};

const STROKE_WIDTH = 28;
const PEN_STROKE_WIDTH = 3;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;
const PAGE_SCROLL_LOCK_MS = 1200;

function scrollViewerToPage(
  viewer: HTMLDivElement,
  pageWrap: HTMLElement,
  behavior: ScrollBehavior = "smooth",
) {
  const viewerRect = viewer.getBoundingClientRect();
  const pageRect = pageWrap.getBoundingClientRect();
  const nextTop = viewer.scrollTop + (pageRect.top - viewerRect.top) - 8;
  viewer.scrollTo({ top: Math.max(0, nextTop), behavior });
}

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

function drawPenStroke(
  ctx: CanvasRenderingContext2D,
  stroke: HighlightStroke,
  colorHex: string,
) {
  if (stroke.points.length < 2) return;
  ctx.save();
  ctx.strokeStyle = colorHex;
  ctx.lineWidth = stroke.width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.globalCompositeOperation = "source-over";
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
      const isPen = highlight.highlight_type === "pen";
      const refW = highlight.position?.viewportWidth ?? canvas.width;
      const refH = highlight.position?.viewportHeight ?? canvas.height;
      highlight.position?.strokes?.forEach((stroke) => {
        const scaled = scaleStroke(stroke, refW, refH, canvas.width, canvas.height);
        if (isPen) drawPenStroke(ctx, scaled, color);
        else drawStroke(ctx, scaled, color);
      });
    });
}

function bindMapRef<T>(map: { current: Map<number, T> }, key: number) {
  return (el: T | null) => {
    if (el) map.current.set(key, el);
    else map.current.delete(key);
  };
}

function canvasRefForPage(
  map: { current: Map<number, HTMLCanvasElement> },
  pageNumber: number,
): { current: HTMLCanvasElement | null } {
  return {
    get current() {
      return map.current.get(pageNumber) ?? null;
    },
    set current(_value: HTMLCanvasElement | null) {
      // read-only view into the page canvas map
    },
  };
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
  canvasRef: { current: HTMLCanvasElement | null };
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
  bookTitle,
  userId,
  initialPage,
  totalPages,
  initialHighlights,
  initialNotes,
}: PdfReaderProps) {
  const pageWrapRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const drawLayerRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const renderTasksRef = useRef<Map<number, { cancel: () => void }>>(new Map());
  const renderGenRef = useRef<Map<number, number>>(new Map());
  const pdfRef = useRef<Awaited<ReturnType<typeof getPdfDocument>> | null>(null);
  const currentStrokeRef = useRef<HighlightStroke | null>(null);
  const isDrawingRef = useRef(false);
  const highlightsRef = useRef(initialHighlights);
  const editingDraftRef = useRef("");
  const noteHadContentRef = useRef(false);
  const finishNoteRef = useRef<(id: string, text: string) => void>(() => {});
  const toolRef = useRef<ReaderTool>("read");
  const editingNoteIdRef = useRef<string | null>(null);
  const maxPageRef = useRef(initialPage);
  const goToPrevPageRef = useRef<() => void>(() => {});
  const goToNextPageRef = useRef<() => void>(() => {});
  const pageRef = useRef(initialPage);
  const scrollLockUntilRef = useRef(0);
  const viewerRef = useRef<HTMLDivElement>(null);
  const fitScaleTimerRef = useRef<number | null>(null);
  const panRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    scrollLeft: number;
    scrollTop: number;
  } | null>(null);

  const [page, setPage] = useState(initialPage);
  const [renderedPages, setRenderedPages] = useState<Set<number>>(
    () => new Set([initialPage]),
  );
  const [pageSlotSize, setPageSlotSize] = useState<{ width: number; height: number } | null>(
    null,
  );
  const [fitScale, setFitScale] = useState(1);
  const [fitScaleReady, setFitScaleReady] = useState(false);
  const [zoomMultiplier, setZoomMultiplier] = useState(0.5);
  const [pdfNumPages, setPdfNumPages] = useState<number | null>(null);
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
  const [saving, setSaving] = useState(false);
  const [saveLabel, setSaveLabel] = useState<string | null>(null);
  const [canvasDisplayWidth, setCanvasDisplayWidth] = useState(0);
  const [pageViewport, setPageViewport] = useState<ViewportSize>({
    width: 0,
    height: 0,
  });

  highlightsRef.current = highlights;
  toolRef.current = tool;
  editingNoteIdRef.current = editingNoteId;
  pageRef.current = page;

  const maxPage = pdfNumPages ?? totalPages ?? page;
  maxPageRef.current = maxPage;

  const scrollToPage = useCallback((target: number, behavior: ScrollBehavior = "smooth") => {
    const clamped = Math.min(maxPageRef.current, Math.max(1, target));
    scrollLockUntilRef.current = Date.now() + PAGE_SCROLL_LOCK_MS;

    setRenderedPages((prev) => {
      const next = new Set(prev);
      next.add(clamped);
      if (clamped > 1) next.add(clamped - 1);
      if (clamped < maxPageRef.current) next.add(clamped + 1);
      return next;
    });
    setPage(clamped);

    const attemptScroll = (retriesLeft: number) => {
      const viewer = viewerRef.current;
      const pageWrap = pageWrapRefs.current.get(clamped);
      if (viewer && pageWrap) {
        scrollViewerToPage(viewer, pageWrap, behavior);
        return;
      }
      if (retriesLeft > 0) {
        requestAnimationFrame(() => attemptScroll(retriesLeft - 1));
      }
    };

    requestAnimationFrame(() => attemptScroll(12));
  }, []);

  const goToPrevPage = useCallback(() => {
    scrollToPage(pageRef.current - 1);
  }, [scrollToPage]);

  const goToNextPage = useCallback(() => {
    scrollToPage(pageRef.current + 1);
  }, [scrollToPage]);

  goToPrevPageRef.current = goToPrevPage;
  goToNextPageRef.current = goToNextPage;

  function canNavigatePages() {
    if (editingNoteIdRef.current || isDrawingRef.current) return false;
    const activeTool = toolRef.current;
    if (activeTool === "note" || activeTool === "highlight" || activeTool === "pen" || activeTool === "pan") {
      return false;
    }
    return true;
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (!canNavigatePages()) return;
      e.preventDefault();
      if (e.key === "ArrowUp") goToPrevPageRef.current();
      else goToNextPageRef.current();
    }

    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, []);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    function onWheel(e: WheelEvent) {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.08 : 0.08;
      setZoomMultiplier((current) =>
        Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number((current + delta).toFixed(2)))),
      );
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
    const canvas = canvasRefs.current.get(page);
    if (!canvas) return;

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      setCanvasDisplayWidth(width);
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [loading, page, fitScale, zoomMultiplier, renderedPages]);

  const computeFitScale = useCallback(async (pageNumber: number) => {
    const pdf = pdfRef.current;
    const viewer = viewerRef.current;
    if (!pdf || !viewer) return 1;

    const pdfPage = await pdf.getPage(pageNumber);
    const base = pdfPage.getViewport({ scale: 1 });
    const padding = 24;
    const width = viewer.clientWidth - padding;
    if (width <= 0) return 1;

    return Math.min(width / base.width, 3);
  }, []);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || loading || !pdfRef.current) return;

    let cancelled = false;
    setFitScaleReady(false);
    void computeFitScale(page).then((next) => {
      if (!cancelled) {
        setFitScale(next);
        setFitScaleReady(true);
      }
    });

    const observer = new ResizeObserver(() => {
      if (fitScaleTimerRef.current) {
        window.clearTimeout(fitScaleTimerRef.current);
      }
      fitScaleTimerRef.current = window.setTimeout(() => {
        void computeFitScale(page).then((next) => {
          setFitScale(next);
          setFitScaleReady(true);
        });
      }, 120);
    });
    observer.observe(viewer);

    return () => {
      cancelled = true;
      observer.disconnect();
      if (fitScaleTimerRef.current) {
        window.clearTimeout(fitScaleTimerRef.current);
      }
    };
  }, [page, loading, computeFitScale]);

  useEffect(() => {
    if (!editingNoteId || isTouch) return;
    const noteId = editingNoteId;

    function handleOutsidePointerDown(e: PointerEvent) {
      const target = e.target as Element;
      if (
        target.closest(".note-root") ||
        target.closest("#note-toolbar") ||
        target.closest("#left-toolbar") ||
        target.closest("#right-toolbar") ||
        target.closest("#reader-top-bar")
      ) {
        return;
      }
      finishNoteRef.current(noteId, editingDraftRef.current);
    }

    window.addEventListener("pointerdown", handleOutsidePointerDown);
    return () => window.removeEventListener("pointerdown", handleOutsidePointerDown);
  }, [editingNoteId, isTouch]);

  const saveProgress = useCallback(
    async (currentPage: number) => {
      await saveReadingProgress(bookId, currentPage, totalPages);
    },
    [bookId, totalPages],
  );

  const renderPage = useCallback(async (pageNumber: number, zoom: number) => {
    const pdf = pdfRef.current;
    const canvas = canvasRefs.current.get(pageNumber);
    const drawLayer = drawLayerRefs.current.get(pageNumber);
    if (!pdf || !canvas || !drawLayer) return;

    const generation = (renderGenRef.current.get(pageNumber) ?? 0) + 1;
    renderGenRef.current.set(pageNumber, generation);

    renderTasksRef.current.get(pageNumber)?.cancel();

    const pdfPage = await pdf.getPage(pageNumber);
    if (generation !== renderGenRef.current.get(pageNumber)) return;

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    const renderScale = zoom * dpr;
    const viewport = pdfPage.getViewport({ scale: renderScale });
    const context = canvas.getContext("2d");
    if (!context) return;

    canvas.width = viewport.width;
    canvas.height = viewport.height;
    canvas.style.width = `${viewport.width / dpr}px`;
    canvas.style.height = `${viewport.height / dpr}px`;
    drawLayer.width = viewport.width;
    drawLayer.height = viewport.height;
    drawLayer.style.width = `${viewport.width / dpr}px`;
    drawLayer.style.height = `${viewport.height / dpr}px`;

    const displayWidth = viewport.width / dpr;
    const displayHeight = viewport.height / dpr;
    setPageSlotSize({ width: displayWidth, height: displayHeight });
    if (pageNumber === page) {
      setPageViewport({ width: viewport.width, height: viewport.height });
    }

    const renderTask = pdfPage.render({ canvasContext: context, viewport, canvas });
    renderTasksRef.current.set(pageNumber, renderTask);

    try {
      await renderTask.promise;
    } catch (err) {
      const name = err instanceof Error ? err.name : "";
      if (name === "RenderingCancelledException") return;
      throw err;
    } finally {
      if (renderTasksRef.current.get(pageNumber) === renderTask) {
        renderTasksRef.current.delete(pageNumber);
      }
    }

    if (generation !== renderGenRef.current.get(pageNumber)) return;
    redrawHighlightLayer(drawLayer, highlightsRef.current, pageNumber);
  }, [page]);

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
        setPdfNumPages(pdf.numPages);
        setFitScaleReady(false);
        void computeFitScale(initialPage).then((next) => {
          if (!active) return;
          setFitScale(next);
          setFitScaleReady(true);
        });
        const startPages = new Set<number>([initialPage]);
        if (initialPage > 1) startPages.add(initialPage - 1);
        if (totalPages && initialPage < totalPages) startPages.add(initialPage + 1);
        else if (pdf.numPages > initialPage) startPages.add(initialPage + 1);
        setRenderedPages(startPages);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load PDF");
        setLoading(false);
      }
    }

    init();
    return () => {
      active = false;
      renderTasksRef.current.forEach((task) => task.cancel());
      renderTasksRef.current.clear();
      renderGenRef.current.clear();
      pdfRef.current?.cleanup();
      pdfRef.current = null;
    };
  }, [bookId, initialHighlights, initialNotes, initialPage, totalPages, computeFitScale]);

  useEffect(() => {
    if (!pdfRef.current || loading || !fitScaleReady) return;
    const zoom = fitScale * zoomMultiplier;
    for (const pageNumber of renderedPages) {
      renderPage(pageNumber, zoom)
        .then(() => setError(null))
        .catch((err) => {
          setError(err instanceof Error ? err.message : "Failed to render page");
        });
    }
  }, [renderedPages, fitScale, fitScaleReady, zoomMultiplier, renderPage, loading]);

  useEffect(() => {
    for (const pageNumber of renderedPages) {
      const drawLayer = drawLayerRefs.current.get(pageNumber);
      if (drawLayer) redrawHighlightLayer(drawLayer, highlights, pageNumber);
    }
  }, [highlights, renderedPages]);

  useEffect(() => {
    if (loading) return;
    scrollLockUntilRef.current = Date.now() + PAGE_SCROLL_LOCK_MS;
    requestAnimationFrame(() => {
      const viewer = viewerRef.current;
      const pageWrap = pageWrapRefs.current.get(initialPage);
      if (viewer && pageWrap) {
        scrollViewerToPage(viewer, pageWrap, "auto");
      }
    });
  }, [loading, initialPage]);

  useEffect(() => {
    if (loading || maxPage <= 0) return;
    const viewer = viewerRef.current;
    if (!viewer) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (Date.now() < scrollLockUntilRef.current) return;

        let visiblePage = pageRef.current;
        let bestRatio = 0;

        for (const entry of entries) {
          const pageNumber = Number((entry.target as HTMLElement).dataset.page);
          if (!Number.isFinite(pageNumber)) continue;

          if (entry.isIntersecting) {
            setRenderedPages((prev) => {
              const next = new Set(prev);
              next.add(pageNumber);
              if (pageNumber > 1) next.add(pageNumber - 1);
              if (pageNumber < maxPageRef.current) next.add(pageNumber + 1);
              return next;
            });
            if (entry.intersectionRatio > bestRatio) {
              bestRatio = entry.intersectionRatio;
              visiblePage = pageNumber;
            }
          }
        }

        if (bestRatio >= 0.35) {
          setPage((current) => (current === visiblePage ? current : visiblePage));
        }
      },
      { root: viewer, threshold: [0, 0.25, 0.5, 0.75, 1] },
    );

    viewer.querySelectorAll("[data-page]").forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [loading, maxPage, fitScale, zoomMultiplier, pageSlotSize]);

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

  function selectTool(next: ReaderTool) {
    if (editingNoteId) {
      void finishNoteRef.current(editingNoteId, editingDraftRef.current);
    }
    setTool((current) => (current === next ? "read" : next));
  }

  function isDrawingTool(activeTool: ReaderTool) {
    return activeTool === "highlight" || activeTool === "pen";
  }

  function isEraserTool(activeTool: ReaderTool) {
    return activeTool === "eraser";
  }

  function isInteractiveDrawLayer(activeTool: ReaderTool) {
    return isDrawingTool(activeTool) || isEraserTool(activeTool);
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

  function getViewportSize(pageNumber: number) {
    const canvas = drawLayerRefs.current.get(pageNumber);
    if (!canvas) return null;
    return { viewportWidth: canvas.width, viewportHeight: canvas.height };
  }

  async function eraseHighlight(id: string, pageNumber: number) {
    try {
      await deleteHighlightApi(id);
      setHighlights((prev) => {
        const next = prev.filter((entry) => entry.id !== id);
        const drawLayer = drawLayerRefs.current.get(pageNumber);
        if (drawLayer) {
          redrawHighlightLayer(drawLayer, next, pageNumber);
        }
        return next;
      });
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not erase mark");
    }
  }

  async function saveStroke(
    pageNumber: number,
    stroke: HighlightStroke,
    highlightType: "freeform" | "pen",
  ) {
    const viewport = getViewportSize(pageNumber);
    try {
      const data = await saveHighlightStroke({
        bookId,
        userId,
        pageNumber,
        color: highlightColor,
        stroke,
        viewport: viewport ?? {},
        highlightType,
      });
      pickHighlightColor(highlightColor);
      setHighlights((prev) => {
        if (prev.some((entry) => entry.id === data.id)) return prev;
        return [...prev, data];
      });
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not save mark");
    }
  }

  function getCanvasPoint(e: ReactPointerEvent<HTMLCanvasElement>) {
    return canvasPointFromClient(e.clientX, e.clientY, e.currentTarget);
  }

  function handleDrawPointerDown(
    e: ReactPointerEvent<HTMLCanvasElement>,
    pageNumber: number,
  ) {
    if (tool === "eraser") {
      const point = getCanvasPoint(e);
      const highlight = findHighlightAtPoint(
        highlightsRef.current,
        pageNumber,
        point,
        e.currentTarget,
      );
      if (highlight) {
        void eraseHighlight(highlight.id, pageNumber);
      }
      return;
    }

    if (!isDrawingTool(tool)) return;
    isDrawingRef.current = true;
    const point = getCanvasPoint(e);
    const width = tool === "pen" ? PEN_STROKE_WIDTH : STROKE_WIDTH;
    currentStrokeRef.current = { points: [point], width };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handleDrawPointerMove(e: ReactPointerEvent<HTMLCanvasElement>) {
    if (!isDrawingRef.current || !isDrawingTool(tool)) return;
    const stroke = currentStrokeRef.current;
    const canvas = e.currentTarget;
    const ctx = canvas.getContext("2d");
    if (!stroke || !canvas || !ctx) return;

    const point = getCanvasPoint(e);
    const last = stroke.points[stroke.points.length - 1];
    stroke.points.push(point);

    if (tool === "pen") {
      ctx.save();
      ctx.strokeStyle = highlightColor;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
      ctx.restore();
      return;
    }

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

  async function handleDrawPointerUp(
    e: ReactPointerEvent<HTMLCanvasElement>,
    pageNumber: number,
  ) {
    if (!isDrawingRef.current || !isDrawingTool(tool)) return;
    isDrawingRef.current = false;
    const stroke = currentStrokeRef.current;
    const highlightType = tool === "pen" ? "pen" : "freeform";
    currentStrokeRef.current = null;

    const canvas = e.currentTarget;
    if (canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }

    if (stroke && stroke.points.length > 1) {
      await saveStroke(pageNumber, stroke, highlightType);
    }
  }

  async function handlePageClick(
    e: ReactPointerEvent<HTMLDivElement>,
    pageNumber: number,
  ) {
    const canvas = canvasRefs.current.get(pageNumber);
    if (!canvas) return;

    if (tool === "eraser") {
      const point = canvasPointFromClient(e.clientX, e.clientY, canvas);
      const note = findNoteAtPoint(notes, pageNumber, point, canvas);
      if (note) {
        await deleteNote(note.id);
      }
      return;
    }

    if (tool !== "note" || editingNoteId) return;

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
        pageNumber,
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

  function handleContainerPointerDown(
    e: ReactPointerEvent<HTMLDivElement>,
    pageNumber: number,
  ) {
    if (tool === "pan") return;

    if (editingNoteId) {
      const target = e.target as Element;
      if (
        !target.closest(".note-root") &&
        !target.closest("#note-toolbar") &&
        !target.closest("#left-toolbar") &&
        !target.closest("#right-toolbar") &&
        !target.closest("#reader-top-bar")
      ) {
        void finishNoteRef.current(editingNoteId, editingDraftRef.current);
      }
      return;
    }

    if (tool === "note" && !editingNoteId) {
      void handlePageClick(e, pageNumber);
      return;
    }

    if (tool === "eraser") {
      void handlePageClick(e, pageNumber);
    }
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

  async function handleSave() {
    setSaving(true);
    setSaveLabel(null);
    try {
      await flushSyncQueue();
      await saveProgress(page);
      setSaveLabel("Saved");
      window.setTimeout(() => setSaveLabel(null), 2000);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  function handleViewerPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (tool !== "pan" || editingNoteId) return;
    const viewer = viewerRef.current;
    if (!viewer) return;
    panRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      scrollLeft: viewer.scrollLeft,
      scrollTop: viewer.scrollTop,
    };
    viewer.setPointerCapture(e.pointerId);
  }

  function handleViewerPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const pan = panRef.current;
    const viewer = viewerRef.current;
    if (!pan || !viewer || pan.pointerId !== e.pointerId) return;
    viewer.scrollLeft = pan.scrollLeft - (e.clientX - pan.startX);
    viewer.scrollTop = pan.scrollTop - (e.clientY - pan.startY);
  }

  function handleViewerPointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    const pan = panRef.current;
    const viewer = viewerRef.current;
    if (!pan || pan.pointerId !== e.pointerId) return;
    panRef.current = null;
    if (viewer?.hasPointerCapture(e.pointerId)) {
      viewer.releasePointerCapture(e.pointerId);
    }
  }

  return (
    <div className="acrobat-reader fixed inset-0 z-40 flex flex-col">
      <ReaderTopBar
        bookId={bookId}
        title={bookTitle}
        saving={saving}
        saveLabel={saveLabel}
        onSave={() => void handleSave()}
      />

      {(offline || message) && (
        <div className="shrink-0 space-y-1 border-b border-white/10 px-3 py-1.5 text-xs">
          {offline && (
            <p className="text-white/60">
              Offline — changes sync when you are back online.
            </p>
          )}
          {message && <p className="text-amber-300">{message}</p>}
        </div>
      )}

      <div className="relative min-h-0 flex-1">
        <LeftToolbar
          tool={tool}
          onSelectTool={selectTool}
          highlightColor={highlightColor}
          recentColors={recentColors}
          onPickHighlightColor={pickHighlightColor}
          onCommitHighlightColor={commitHighlightColor}
          onHighlightColorChange={setHighlightColor}
          noteTextColor={noteTextColor}
          noteFontSize={noteFontSize}
          editingNote={Boolean(editingNoteId)}
          onPickNoteColor={pickNoteColor}
          onAdjustNoteFontSize={adjustNoteFontSize}
        />

        <div
          ref={viewerRef}
          className={cn(
            "acrobat-viewport h-full overflow-auto",
            tool === "pan" && "cursor-grab active:cursor-grabbing",
          )}
          onPointerDown={handleViewerPointerDown}
          onPointerMove={handleViewerPointerMove}
          onPointerUp={handleViewerPointerUp}
          onPointerCancel={handleViewerPointerUp}
        >
          {loading && (
            <p className="flex h-full items-center justify-center text-sm text-white/55">
              Loading PDF...
            </p>
          )}
          {error && (
            <p className="flex h-full items-center justify-center px-6 text-center text-sm text-red-300">
              {error}
            </p>
          )}
          <div
            className="mx-auto flex w-full flex-col items-center gap-3 py-6"
            style={{ visibility: loading || error ? "hidden" : "visible" }}
          >
            {Array.from({ length: maxPage }, (_, index) => {
              const pageNumber = index + 1;
              const slotWidth = pageSlotSize?.width ?? 420;
              const slotHeight = pageSlotSize?.height ?? 594;

              return (
                <div
                  key={pageNumber}
                  data-page={pageNumber}
                  ref={bindMapRef(pageWrapRefs, pageNumber)}
                  className={cn(
                    "relative w-fit",
                    (tool === "note" || tool === "eraser") &&
                      !editingNoteId &&
                      "cursor-crosshair",
                  )}
                  onPointerDown={(e) => handleContainerPointerDown(e, pageNumber)}
                >
                  {renderedPages.has(pageNumber) ? (
                    <>
                      <canvas
                        ref={bindMapRef(canvasRefs, pageNumber)}
                        className="acrobat-page-panel block bg-white"
                      />
                      <canvas
                        ref={bindMapRef(drawLayerRefs, pageNumber)}
                        className={cn(
                          "absolute left-0 top-0 touch-none",
                          isInteractiveDrawLayer(tool)
                            ? "cursor-crosshair"
                            : "pointer-events-none",
                        )}
                        onPointerDown={(e) => handleDrawPointerDown(e, pageNumber)}
                        onPointerMove={handleDrawPointerMove}
                        onPointerUp={(e) => handleDrawPointerUp(e, pageNumber)}
                        onPointerLeave={(e) => handleDrawPointerUp(e, pageNumber)}
                      />
                      {notes
                        .filter((note) => note.page_number === pageNumber)
                        .map((note) => (
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
                            canvasRef={canvasRefForPage(canvasRefs, pageNumber)}
                            canvasDisplayWidth={
                              pageNumber === page ? canvasDisplayWidth : slotWidth
                            }
                            pageViewport={pageViewport}
                          />
                        ))}
                    </>
                  ) : (
                    <div
                      className="acrobat-page-panel bg-white"
                      style={{ width: slotWidth, height: slotHeight }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <RightToolbar
          page={page}
          maxPage={maxPage}
          zoomPercent={Math.round(zoomMultiplier * 100)}
          onGoToPage={scrollToPage}
          onPrevPage={goToPrevPage}
          onNextPage={goToNextPage}
          prevDisabled={page <= 1}
          nextDisabled={page >= maxPage}
          onZoomIn={() =>
            setZoomMultiplier((z) =>
              Math.min(MAX_ZOOM, Number((z + 0.1).toFixed(2))),
            )
          }
          onZoomOut={() =>
            setZoomMultiplier((z) =>
              Math.max(MIN_ZOOM, Number((z - 0.1).toFixed(2))),
            )
          }
        />
      </div>
    </div>
  );
}
