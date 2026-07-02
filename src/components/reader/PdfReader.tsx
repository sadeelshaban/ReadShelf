"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type {
  Bookmark,
  Highlight,
  HighlightShape,
  HighlightStroke,
  Note,
  NotePosition,
  ReaderTool,
  ShapeKind,
} from "@/types";
import { createClient } from "@/lib/supabase/client";
import { canvasPointFromClient, type ViewportSize } from "@/lib/reader/coordinates";
import {
  DEFAULT_NOTE_FONT_SIZE,
  MAX_NOTE_FONT_SIZE,
  MIN_NOTE_FONT_SIZE,
  loadEraserStrokeWidth,
  loadHighlightStrokeWidth,
  loadLastHighlightColor,
  loadLastPenColor,
  loadPenStrokeWidth,
  loadRecentHighlightColors,
  loadRecentPenColors,
  loadShapeFilled,
  loadShapeKind,
  saveEraserStrokeWidth,
  saveHighlightStrokeWidth,
  savePenStrokeWidth,
  saveRecentHighlightColor,
  saveRecentPenColor,
  saveShapeFilled,
  saveShapeKind,
} from "@/lib/reader/constants";
import { shapeHighlightType } from "@/lib/reader/shapes";
import { redrawHighlightLayer } from "@/lib/reader/pdf-reader-canvas";
import {
  DEFAULT_ZOOM,
  MAX_ZOOM,
  MIN_ZOOM,
  PROGRAMMATIC_SCROLL_TIMEOUT_MS,
  READING_IDLE_SAVE_MS,
  SCROLL_PROGRESS_DEBOUNCE_MS,
  SCROLL_SYNC_DEBOUNCE_MS,
  ZOOM_STEP,
} from "@/lib/reader/pdf-reader-config";
import {
  bindMapRef,
  canvasRefForPage,
  isTouchDevice,
} from "@/lib/reader/pdf-reader-dom";
import {
  type HighlightChange,
  type HistoryAction,
  mergeHighlightChanges,
} from "@/lib/reader/pdf-reader-history";
import {
  mergeRenderedPages,
  resolveVisiblePage,
  scrollViewerToPage,
} from "@/lib/reader/pdf-reader-scroll";
import {
  canNavigatePages as canNavigatePagesCheck,
  isDrawingTool,
  isInteractiveDrawLayer,
  isNoteTextTarget,
} from "@/lib/reader/pdf-reader-tools";
import { findNoteAtPoint } from "@/lib/reader/hit-test";
import {
  applyEraserChanges,
  computeEraserChanges,
  effectiveStrokeWidth,
  eraserBrushRadius,
} from "@/lib/reader/stroke-erase";
import { getPdfDocument } from "@/lib/pdf";
import {
  clearNoteText,
  deleteHighlight as deleteHighlightApi,
  deleteNote as deleteNoteApi,
  deleteBookmark as deleteBookmarkApi,
  flushSyncQueue,
  insertBookmark,
  insertNote,
  loadPdfBuffer,
  moveNote as moveNoteApi,
  persistHighlight,
  resetBookForReread,
  saveReadingProgress,
  seedBookAnnotations,
  updateHighlight,
  upsertHighlight,
  upsertNote,
  updateNoteColor as updateNoteColorApi,
  updateNoteFontSize as updateNoteFontSizeApi,
  updateNoteText,
} from "@/lib/offline/reader-api";
import { isOnline } from "@/lib/offline/online";
import { LeftToolbar, RightToolbar } from "@/components/reader/ReaderToolbars";
import { EraserCursorOverlay } from "@/components/reader/EraserCursorOverlay";
import { ReaderTopBar } from "@/components/reader/ReaderTopBar";
import { PageBookmarkRibbon } from "@/components/reader/PageBookmarkRibbon";
import {
  BookmarkAddPanel,
  BookmarkDeleteConfirm,
} from "@/components/reader/BookmarkAddPanel";
import { ContinueReadingPrompt } from "@/components/reader/ContinueReadingPrompt";
import { PageNote } from "@/components/reader/PageNote";
import { ReadAgainPrompt } from "@/components/reader/ReadAgainPrompt";
import type { BookmarkColorId } from "@/lib/reader/bookmarks";
import { normalizeBookmarkLabel } from "@/lib/reader/bookmarks";
import { cn } from "@/lib/utils";

type PdfReaderProps = {
  bookId: string;
  bookTitle: string;
  userId: string;
  initialPage: number;
  initialScrollY: number | null;
  initialZoom: number | null;
  restoreScrollPosition: boolean;
  showResumePrompt: boolean;
  showReadAgainPrompt: boolean;
  readCount: number;
  totalPages: number | null;
  initialHighlights: Highlight[];
  initialNotes: Note[];
  initialBookmarks: Bookmark[];
};


export function PdfReader({
  bookId,
  bookTitle,
  userId,
  initialPage,
  initialScrollY,
  initialZoom,
  restoreScrollPosition,
  showResumePrompt,
  showReadAgainPrompt,
  readCount,
  totalPages,
  initialHighlights,
  initialNotes,
  initialBookmarks,
}: PdfReaderProps) {
  const pageWrapRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const drawLayerRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const renderTasksRef = useRef<Map<number, { cancel: () => void }>>(new Map());
  const renderGenRef = useRef<Map<number, number>>(new Map());
  const pdfRef = useRef<Awaited<ReturnType<typeof getPdfDocument>> | null>(null);
  const currentStrokeRef = useRef<HighlightStroke | null>(null);
  const currentShapeRef = useRef<HighlightShape | null>(null);
  const isDrawingRef = useRef(false);
  const isErasingRef = useRef(false);
  const currentEraserPathRef = useRef<Array<{ x: number; y: number }>>([]);
  const currentDrawPageRef = useRef<number | null>(null);
  const eraserSessionRef = useRef<{
    pageNumber: number;
    baseline: Highlight[];
  } | null>(null);
  const eraserCursorRef = useRef<{ x: number; y: number } | null>(null);
  const annotationSyncTimerRef = useRef<number | null>(null);
  const undoStackRef = useRef<HistoryAction[]>([]);
  const redoStackRef = useRef<HistoryAction[]>([]);
  const applyingHistoryRef = useRef(false);
  const eraserStrokeWidthRef = useRef(loadEraserStrokeWidth());
  const skipHighlightRedrawRef = useRef<Set<number>>(new Set());
  const highlightsRef = useRef(initialHighlights);
  const editingDraftRef = useRef("");
  const noteHadContentRef = useRef(false);
  const finishNoteRef = useRef<(id: string, text: string) => void>(() => {});
  const toolRef = useRef<ReaderTool>("read");
  const editingNoteIdRef = useRef<string | null>(null);
  const maxPageRef = useRef(initialPage);
  const goToPrevPageRef = useRef<() => void>(() => {});
  const goToNextPageRef = useRef<() => void>(() => {});
  const keyboardHandlerRef = useRef<(event: KeyboardEvent) => void>(() => {});
  const pageRef = useRef(initialPage);
  const programmaticScrollTargetRef = useRef<number | null>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const fitScaleTimerRef = useRef<number | null>(null);
  const scrollSyncTimerRef = useRef<number | null>(null);
  const scrollProgressTimerRef = useRef<number | null>(null);
  const idleProgressTimerRef = useRef<number | null>(null);
  const programmaticScrollTimerRef = useRef<number | null>(null);
  const saveProgressRef = useRef<(currentPage: number) => Promise<void>>(async () => {});
  const pendingZoomRestoreRef = useRef<{
    scrollTop: number;
    scrollLeft: number;
    pageNumber: number;
  } | null>(null);
  const zoomMultiplierRef = useRef(initialZoom ?? DEFAULT_ZOOM);
  const lastRenderedZoomRef = useRef<Map<number, number>>(new Map());
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
  const [zoomMultiplier, setZoomMultiplier] = useState(initialZoom ?? DEFAULT_ZOOM);
  const [pdfNumPages, setPdfNumPages] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tool, setTool] = useState<ReaderTool>("read");
  const [highlights, setHighlights] = useState(initialHighlights);
  const [notes, setNotes] = useState(initialNotes);
  const [bookmarks, setBookmarks] = useState(initialBookmarks);
  const [bookmarkColor, setBookmarkColor] = useState<BookmarkColorId>("yellow");
  const [bookmarkLabel, setBookmarkLabel] = useState("");
  const [bookmarkToDelete, setBookmarkToDelete] = useState<Bookmark | null>(null);
  const [bookmarkPulse, setBookmarkPulse] = useState(false);
  const bookmarkPulseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [resumeReady, setResumeReady] = useState(!showResumePrompt && !showReadAgainPrompt);
  const [showResumeOverlay, setShowResumeOverlay] = useState(showResumePrompt);
  const [showReadAgainOverlay, setShowReadAgainOverlay] = useState(showReadAgainPrompt);
  const [message, setMessage] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteMenuId, setNoteMenuId] = useState<string | null>(null);
  const [noteTextColor, setNoteTextColor] = useState("black");
  const [noteFontSize, setNoteFontSize] = useState(DEFAULT_NOTE_FONT_SIZE);
  const [highlightColor, setHighlightColor] = useState(loadLastHighlightColor);
  const [penColor, setPenColor] = useState(loadLastPenColor);
  const [recentHighlightColors, setRecentHighlightColors] = useState(loadRecentHighlightColors);
  const [recentPenColors, setRecentPenColors] = useState(loadRecentPenColors);
  const [highlightStrokeWidth, setHighlightStrokeWidth] = useState(loadHighlightStrokeWidth);
  const [penStrokeWidth, setPenStrokeWidth] = useState(loadPenStrokeWidth);
  const [eraserStrokeWidth, setEraserStrokeWidth] = useState(loadEraserStrokeWidth);
  const [shapeKind, setShapeKind] = useState<ShapeKind>(loadShapeKind);
  const [shapeFilled, setShapeFilled] = useState(loadShapeFilled);
  const [eraserOverlay, setEraserOverlay] = useState<{
    x: number;
    y: number;
    diameter: number;
  } | null>(null);
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
  eraserStrokeWidthRef.current = eraserStrokeWidth;
  zoomMultiplierRef.current = zoomMultiplier;

  const maxPage = pdfNumPages ?? totalPages ?? page;
  maxPageRef.current = maxPage;

  const syncPageFromScroll = useCallback(
    (options?: { force?: boolean }) => {
      const viewer = viewerRef.current;
      if (!viewer || loading) return;

      const visible = resolveVisiblePage(
        viewer,
        pageWrapRefs.current,
        maxPageRef.current,
      );

      const target = programmaticScrollTargetRef.current;
      if (target !== null && !options?.force) {
        if (visible === target) {
          programmaticScrollTargetRef.current = null;
        } else {
          return;
        }
      }

      if (visible !== pageRef.current) {
        setPage(visible);
        setRenderedPages((prev) =>
          mergeRenderedPages(prev, visible, maxPageRef.current),
        );
      }
    },
    [loading],
  );

  const scheduleScrollSync = useCallback(() => {
    if (scrollSyncTimerRef.current) {
      window.clearTimeout(scrollSyncTimerRef.current);
    }
    scrollSyncTimerRef.current = window.setTimeout(() => {
      syncPageFromScroll();
    }, SCROLL_SYNC_DEBOUNCE_MS);
  }, [syncPageFromScroll]);

  const scheduleProgressSaveFromScroll = useCallback(() => {
    if (scrollProgressTimerRef.current) {
      window.clearTimeout(scrollProgressTimerRef.current);
    }
    scrollProgressTimerRef.current = window.setTimeout(() => {
      void saveProgressRef.current(pageRef.current);
    }, SCROLL_PROGRESS_DEBOUNCE_MS);

    if (idleProgressTimerRef.current) {
      window.clearTimeout(idleProgressTimerRef.current);
    }
    idleProgressTimerRef.current = window.setTimeout(() => {
      void saveProgressRef.current(pageRef.current);
    }, READING_IDLE_SAVE_MS);
  }, []);

  const scrollToPage = useCallback((target: number, behavior: ScrollBehavior = "smooth") => {
    const clamped = Math.min(maxPageRef.current, Math.max(1, target));
    programmaticScrollTargetRef.current = clamped;

    if (programmaticScrollTimerRef.current) {
      window.clearTimeout(programmaticScrollTimerRef.current);
    }

    setRenderedPages((prev) => mergeRenderedPages(prev, clamped, maxPageRef.current));
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

    programmaticScrollTimerRef.current = window.setTimeout(() => {
      if (programmaticScrollTargetRef.current === clamped) {
        programmaticScrollTargetRef.current = null;
      }
      syncPageFromScroll({ force: true });
    }, behavior === "smooth" ? PROGRAMMATIC_SCROLL_TIMEOUT_MS : 120);
  }, [syncPageFromScroll]);

  const goToPrevPage = useCallback(() => {
    scrollToPage(pageRef.current - 1);
  }, [scrollToPage]);

  const goToNextPage = useCallback(() => {
    scrollToPage(pageRef.current + 1);
  }, [scrollToPage]);

  goToPrevPageRef.current = goToPrevPage;
  goToNextPageRef.current = goToNextPage;

  const restorePendingZoomScroll = useCallback(() => {
    const pending = pendingZoomRestoreRef.current;
    const viewer = viewerRef.current;
    if (!pending || !viewer) return;

    viewer.scrollTop = pending.scrollTop;
    viewer.scrollLeft = pending.scrollLeft;
    pendingZoomRestoreRef.current = null;
    requestAnimationFrame(() => syncPageFromScroll({ force: true }));
  }, [syncPageFromScroll]);

  const changeZoom = useCallback(
    (
      deltaOrTarget: number | ((current: number) => number),
      anchor?: { clientX: number; clientY: number },
    ) => {
      const viewer = viewerRef.current;
      if (!viewer) return;

      const current = zoomMultiplierRef.current;
      const raw =
        typeof deltaOrTarget === "function" ? deltaOrTarget(current) : deltaOrTarget;
      const clamped = Math.min(
        MAX_ZOOM,
        Math.max(MIN_ZOOM, Number(raw.toFixed(2))),
      );
      if (Math.abs(clamped - current) < 0.001) return;

      const ratio = clamped / current;

      if (anchor) {
        const rect = viewer.getBoundingClientRect();
        const contentX = anchor.clientX - rect.left + viewer.scrollLeft;
        const contentY = anchor.clientY - rect.top + viewer.scrollTop;
        pendingZoomRestoreRef.current = {
          scrollLeft: contentX * ratio - (anchor.clientX - rect.left),
          scrollTop: contentY * ratio - (anchor.clientY - rect.top),
          pageNumber: pageRef.current,
        };
      } else {
        pendingZoomRestoreRef.current = {
          scrollTop: viewer.scrollTop * ratio,
          scrollLeft: viewer.scrollLeft * ratio,
          pageNumber: pageRef.current,
        };
      }

      setZoomMultiplier(clamped);
    },
    [],
  );

  const zoomIn = useCallback(() => {
    changeZoom((current) => current + ZOOM_STEP);
  }, [changeZoom]);

  const zoomOut = useCallback(() => {
    changeZoom((current) => current - ZOOM_STEP);
  }, [changeZoom]);

  function canNavigatePages() {
    return canNavigatePagesCheck({
      editingNoteId: editingNoteIdRef.current,
      isDrawing: isDrawingRef.current,
      isErasing: isErasingRef.current,
      activeTool: toolRef.current,
    });
  }

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    function onWheel(e: WheelEvent) {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      changeZoom((current) => current + delta, {
        clientX: e.clientX,
        clientY: e.clientY,
      });
    }

    viewer.addEventListener("wheel", onWheel, { passive: false });
    return () => viewer.removeEventListener("wheel", onWheel);
  }, [changeZoom]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      keyboardHandlerRef.current(event);
    }

    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
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
      setCanvasDisplayWidth((prev) =>
        Math.abs(prev - width) < 0.5 ? prev : width,
      );
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [loading, page, fitScale, zoomMultiplier]);

  const computeFitScale = useCallback(async (pageNumber: number) => {
    const pdf = pdfRef.current;
    const viewer = viewerRef.current;
    if (!pdf || !viewer) return 1;

    const pdfPage = await pdf.getPage(pageNumber);
    const base = pdfPage.getViewport({ scale: 1 });
    const padding = 14;
    const width = viewer.clientWidth - padding;
    if (width <= 0) return 1;

    return Math.min(width / base.width, 3);
  }, []);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || loading || !pdfRef.current) return;

    let cancelled = false;

    function applyFitScale(next: number) {
      if (cancelled) return;
      setFitScale((prev) => (Math.abs(prev - next) < 0.001 ? prev : next));
      setFitScaleReady(true);
    }

    void computeFitScale(1).then(applyFitScale);

    const observer = new ResizeObserver(() => {
      if (fitScaleTimerRef.current) {
        window.clearTimeout(fitScaleTimerRef.current);
      }
      fitScaleTimerRef.current = window.setTimeout(() => {
        void computeFitScale(1).then(applyFitScale);
      }, 200);
    });
    observer.observe(viewer);

    return () => {
      cancelled = true;
      observer.disconnect();
      if (fitScaleTimerRef.current) {
        window.clearTimeout(fitScaleTimerRef.current);
      }
    };
  }, [loading, computeFitScale]);

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
      const viewer = viewerRef.current;
      await saveReadingProgress(bookId, currentPage, totalPages ?? pdfNumPages, {
        scrollY: viewer?.scrollTop ?? 0,
        zoom: zoomMultiplierRef.current,
      });
    },
    [bookId, totalPages, pdfNumPages],
  );

  saveProgressRef.current = saveProgress;

  const restoreSavedPosition = useCallback(
    (behavior: ScrollBehavior = "auto") => {
      const viewer = viewerRef.current;
      if (!viewer) return;

      programmaticScrollTargetRef.current = initialPage;

      if (restoreScrollPosition && initialScrollY != null && initialScrollY > 0) {
        viewer.scrollTop = initialScrollY;
      } else {
        const pageWrap = pageWrapRefs.current.get(initialPage);
        if (pageWrap) {
          scrollViewerToPage(viewer, pageWrap, behavior);
        }
      }

      window.setTimeout(() => {
        programmaticScrollTargetRef.current = null;
        syncPageFromScroll({ force: true });
      }, behavior === "smooth" ? PROGRAMMATIC_SCROLL_TIMEOUT_MS : 150);
    },
    [initialPage, initialScrollY, restoreScrollPosition, syncPageFromScroll],
  );

  const jumpToBookmark = useCallback(
    (bookmark: Bookmark) => {
      scrollToPage(bookmark.page_number);
    },
    [scrollToPage],
  );

  const handleAddBookmark = useCallback(async () => {
    const viewer = viewerRef.current;
    const scrollY = viewer?.scrollTop ?? 0;
    const currentPage = pageRef.current;
    const label = bookmarkLabel.trim() || `Page ${currentPage}`;
    const created = await insertBookmark({
      bookId,
      userId,
      pageNumber: currentPage,
      scrollY,
      label,
      noteText: "",
      color: bookmarkColor,
    });
    setBookmarks((prev) =>
      [...prev, created].sort((a, b) => a.page_number - b.page_number),
    );
    setBookmarkLabel("");
    setTool("read");
    if (bookmarkPulseTimeoutRef.current) {
      clearTimeout(bookmarkPulseTimeoutRef.current);
    }
    setBookmarkPulse(true);
    bookmarkPulseTimeoutRef.current = setTimeout(() => setBookmarkPulse(false), 550);
  }, [bookId, userId, bookmarkColor, bookmarkLabel]);

  const handleConfirmDeleteBookmark = useCallback(async () => {
    if (!bookmarkToDelete) return;
    await deleteBookmarkApi(bookmarkToDelete.id);
    setBookmarks((prev) => prev.filter((entry) => entry.id !== bookmarkToDelete.id));
    setBookmarkToDelete(null);
  }, [bookmarkToDelete]);

  const renderPage = useCallback(async (pageNumber: number, zoom: number) => {
    const pdf = pdfRef.current;
    const canvas = canvasRefs.current.get(pageNumber);
    const drawLayer = drawLayerRefs.current.get(pageNumber);
    if (!pdf || !canvas || !drawLayer) return;

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    const renderScale = zoom * dpr;
    const pdfPage = await pdf.getPage(pageNumber);
    const viewport = pdfPage.getViewport({ scale: renderScale });
    const pixelWidth = viewport.width;
    const pixelHeight = viewport.height;
    const cssWidth = pixelWidth / dpr;
    const cssHeight = pixelHeight / dpr;

    const alreadyRendered =
      lastRenderedZoomRef.current.get(pageNumber) === zoom &&
      canvas.width === pixelWidth &&
      canvas.height === pixelHeight;
    if (alreadyRendered) return;

    const generation = (renderGenRef.current.get(pageNumber) ?? 0) + 1;
    renderGenRef.current.set(pageNumber, generation);

    renderTasksRef.current.get(pageNumber)?.cancel();

    if (generation !== renderGenRef.current.get(pageNumber)) return;

    const needsResize =
      canvas.width !== pixelWidth || canvas.height !== pixelHeight;
    const scratch = document.createElement("canvas");
    scratch.width = pixelWidth;
    scratch.height = pixelHeight;
    const scratchContext = scratch.getContext("2d");
    if (!scratchContext) return;

    const renderTask = pdfPage.render({
      canvasContext: scratchContext,
      viewport,
      canvas: scratch,
    });
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

    const context = canvas.getContext("2d");
    if (!context) return;

    if (needsResize) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${cssHeight}px`;

      if (
        drawLayer.width !== pixelWidth ||
        drawLayer.height !== pixelHeight
      ) {
        drawLayer.width = pixelWidth;
        drawLayer.height = pixelHeight;
        drawLayer.style.width = `${cssWidth}px`;
        drawLayer.style.height = `${cssHeight}px`;
      }
    }

    context.drawImage(scratch, 0, 0);

    lastRenderedZoomRef.current.set(pageNumber, zoom);

    setPageSlotSize((prev) => {
      if (
        prev &&
        Math.abs(prev.width - cssWidth) < 0.5 &&
        Math.abs(prev.height - cssHeight) < 0.5
      ) {
        return prev;
      }
      return { width: cssWidth, height: cssHeight };
    });
    if (pageNumber === pageRef.current) {
      setPageViewport((prev) => {
        if (prev.width === pixelWidth && prev.height === pixelHeight) {
          return prev;
        }
        return { width: pixelWidth, height: pixelHeight };
      });
    }

    redrawHighlightLayer(drawLayer, highlightsRef.current, pageNumber);

    if (
      pendingZoomRestoreRef.current &&
      pageNumber === pendingZoomRestoreRef.current.pageNumber
    ) {
      requestAnimationFrame(() => {
        restorePendingZoomScroll();
      });
    }
  }, [restorePendingZoomScroll]);

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
        setRenderedPages(mergeRenderedPages(new Set(), initialPage, pdf.numPages));
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load PDF");
        setLoading(false);
      }
    }

    init();
    return () => {
      active = false;
      if (annotationSyncTimerRef.current) {
        window.clearTimeout(annotationSyncTimerRef.current);
      }
      if (scrollSyncTimerRef.current) {
        window.clearTimeout(scrollSyncTimerRef.current);
      }
      if (scrollProgressTimerRef.current) {
        window.clearTimeout(scrollProgressTimerRef.current);
      }
      if (programmaticScrollTimerRef.current) {
        window.clearTimeout(programmaticScrollTimerRef.current);
      }
      renderTasksRef.current.forEach((task) => task.cancel());
      renderTasksRef.current.clear();
      renderGenRef.current.clear();
      lastRenderedZoomRef.current.clear();
      pdfRef.current?.cleanup();
      pdfRef.current = null;
    };
  }, [bookId, initialHighlights, initialNotes, initialPage, totalPages]);

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
    if (loading || !fitScaleReady || !pendingZoomRestoreRef.current) return;

    const timer = window.setTimeout(() => {
      restorePendingZoomScroll();
    }, 120);

    return () => window.clearTimeout(timer);
  }, [zoomMultiplier, fitScale, pageSlotSize, fitScaleReady, loading, restorePendingZoomScroll]);

  useEffect(() => {
    lastRenderedZoomRef.current.clear();
  }, [fitScale, zoomMultiplier]);

  useEffect(() => {
    for (const pageNumber of renderedPages) {
      if (skipHighlightRedrawRef.current.has(pageNumber)) continue;
      const drawLayer = drawLayerRefs.current.get(pageNumber);
      if (drawLayer) redrawHighlightLayer(drawLayer, highlights, pageNumber);
    }
    skipHighlightRedrawRef.current.clear();
  }, [highlights, renderedPages]);

  function redrawPageHighlights(
    pageNumber: number,
    list: Highlight[],
    eraserPreview?: { x: number; y: number; diameter: number },
  ) {
    const drawLayer = drawLayerRefs.current.get(pageNumber);
    if (drawLayer) {
      redrawHighlightLayer(drawLayer, list, pageNumber, undefined, eraserPreview);
    }
  }

  function scheduleAnnotationSync() {
    if (annotationSyncTimerRef.current) {
      window.clearTimeout(annotationSyncTimerRef.current);
    }
    annotationSyncTimerRef.current = window.setTimeout(() => {
      void flushSyncQueue().catch(() => {
        // Background sync; explicit Save still available.
      });
    }, 600);
  }

  function persistEraserChanges(changes: HighlightChange[]) {
    scheduleAnnotationSync();
    void Promise.all(
      changes.map((change) =>
        change.after === null
          ? deleteHighlightApi(change.before.id)
          : updateHighlight(change.after.id, change.after.position!),
      ),
    ).catch((err) => {
      setMessage(err instanceof Error ? err.message : "Could not erase mark");
    });
  }

  function syncEraserOverlay(clientX: number, clientY: number) {
    if (toolRef.current !== "eraser") {
      setEraserOverlay(null);
      return;
    }

    for (const canvas of drawLayerRefs.current.values()) {
      const rect = canvas.getBoundingClientRect();
      if (
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom
      ) {
        const scale = rect.width / canvas.width;
        const diameter = effectiveStrokeWidth(eraserStrokeWidthRef.current) * scale;
        setEraserOverlay({ x: clientX, y: clientY, diameter });
        return;
      }
    }

    setEraserOverlay(null);
  }

  function previewEraser(
    pageNumber: number,
    point: { x: number; y: number },
    clientX: number,
    clientY: number,
  ) {
    eraserCursorRef.current = point;
    syncEraserOverlay(clientX, clientY);
    redrawPageHighlights(pageNumber, highlightsRef.current);
  }

  function liveApplyEraser(pageNumber: number, eraserPath: Array<{ x: number; y: number }>) {
    const session = eraserSessionRef.current;
    if (!session || session.pageNumber !== pageNumber) return;

    const changes = computeEraserChanges(
      session.baseline,
      pageNumber,
      eraserPath,
      eraserStrokeWidthRef.current,
    );
    const next = applyEraserChanges(session.baseline, changes);
    highlightsRef.current = next;

    const cursor = eraserCursorRef.current;
    redrawPageHighlights(pageNumber, next);
    if (cursor) {
      skipHighlightRedrawRef.current.add(pageNumber);
    }
  }

  function finishEraserStroke(pageNumber: number, eraserPath: Array<{ x: number; y: number }>) {
    const session = eraserSessionRef.current;
    eraserSessionRef.current = null;
    eraserCursorRef.current = null;

    if (!session || session.pageNumber !== pageNumber || eraserPath.length === 0) {
      redrawPageHighlights(pageNumber, highlightsRef.current);
      return;
    }

    const changes = computeEraserChanges(
      session.baseline,
      pageNumber,
      eraserPath,
      eraserStrokeWidthRef.current,
    );
    if (changes.length === 0) {
      highlightsRef.current = session.baseline;
      commitHighlights(session.baseline, [pageNumber]);
      return;
    }

    const next = applyEraserChanges(session.baseline, changes);
    pushHistory({ type: "batch_highlight", changes });
    commitHighlights(next, [pageNumber]);
    persistEraserChanges(changes);
  }

  function commitHighlights(next: Highlight[], affectedPages: number[]) {
    highlightsRef.current = next;
    for (const pageNumber of affectedPages) {
      redrawPageHighlights(pageNumber, next);
      skipHighlightRedrawRef.current.add(pageNumber);
    }
    setHighlights(next);
  }

  function addHighlightOptimistic(highlight: Highlight) {
    const next = [...highlightsRef.current, highlight];
    highlightsRef.current = next;
    redrawPageHighlights(highlight.page_number, next);
    skipHighlightRedrawRef.current.add(highlight.page_number);
    setHighlights(next);
  }

  useEffect(() => {
    if (loading || !fitScaleReady || !resumeReady) return;
    requestAnimationFrame(() => restoreSavedPosition("auto"));
  }, [loading, fitScaleReady, resumeReady, restoreSavedPosition]);

  useEffect(() => {
    if (loading || maxPage <= 0) return;
    const viewer = viewerRef.current;
    if (!viewer) return;

    function onScroll() {
      scheduleScrollSync();
      scheduleProgressSaveFromScroll();
    }

    viewer.addEventListener("scroll", onScroll, { passive: true });
    requestAnimationFrame(() => syncPageFromScroll({ force: true }));

    return () => {
      viewer.removeEventListener("scroll", onScroll);
      if (scrollSyncTimerRef.current) {
        window.clearTimeout(scrollSyncTimerRef.current);
      }
      if (scrollProgressTimerRef.current) {
        window.clearTimeout(scrollProgressTimerRef.current);
      }
      if (idleProgressTimerRef.current) {
        window.clearTimeout(idleProgressTimerRef.current);
      }
    };
  }, [loading, maxPage, scheduleScrollSync, scheduleProgressSaveFromScroll, syncPageFromScroll]);

  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState === "hidden") {
        void saveProgressRef.current(pageRef.current);
      }
    }

    function onPageHide() {
      void saveProgressRef.current(pageRef.current);
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void saveProgress(page);
      if (idleProgressTimerRef.current) {
        window.clearTimeout(idleProgressTimerRef.current);
      }
      idleProgressTimerRef.current = window.setTimeout(() => {
        void saveProgressRef.current(pageRef.current);
      }, READING_IDLE_SAVE_MS);
    }, 500);
    return () => clearTimeout(timer);
  }, [page, zoomMultiplier, saveProgress]);

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
    setRecentHighlightColors(loadRecentHighlightColors());
  }

  function pickHighlightColor(color: string) {
    commitHighlightColor(color);
  }

  function commitPenColor(color: string) {
    const saved = saveRecentPenColor(color);
    setPenColor(saved);
    setRecentPenColors(loadRecentPenColors());
  }

  function pickPenColor(color: string) {
    commitPenColor(color);
  }

  function selectTool(next: ReaderTool, options?: { force?: boolean }) {
    if (editingNoteId) {
      void finishNoteRef.current(editingNoteId, editingDraftRef.current);
    }
    setTool((current) => {
      if (options?.force) return next;
      return current === next ? "read" : next;
    });
    if (next !== "eraser") {
      setEraserOverlay(null);
    }
  }

  function setHighlightStrokeWidthAndSave(width: number) {
    setHighlightStrokeWidth(width);
    saveHighlightStrokeWidth(width);
  }

  function setPenStrokeWidthAndSave(width: number) {
    setPenStrokeWidth(width);
    savePenStrokeWidth(width);
  }

  function setEraserStrokeWidthAndSave(width: number) {
    setEraserStrokeWidth(width);
    saveEraserStrokeWidth(width);
    if (eraserOverlay) {
      const pageCanvas = [...drawLayerRefs.current.values()].find((canvas) => {
        const rect = canvas.getBoundingClientRect();
        return (
          eraserOverlay.x >= rect.left &&
          eraserOverlay.x <= rect.right &&
          eraserOverlay.y >= rect.top &&
          eraserOverlay.y <= rect.bottom
        );
      });
      if (pageCanvas) {
        const rect = pageCanvas.getBoundingClientRect();
        const scale = rect.width / pageCanvas.width;
        setEraserOverlay({
          ...eraserOverlay,
          diameter: effectiveStrokeWidth(width) * scale,
        });
      }
    }
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

  function pushHistory(action: HistoryAction) {
    if (applyingHistoryRef.current) return;
    undoStackRef.current.push(action);
    redoStackRef.current = [];
    if (undoStackRef.current.length > 100) {
      undoStackRef.current.shift();
    }
  }

  async function performUndo() {
    const action = undoStackRef.current.pop();
    if (!action) return;

    applyingHistoryRef.current = true;
    try {
      if (action.type === "add_highlight") {
        const next = highlightsRef.current.filter(
          (entry) => entry.id !== action.highlight.id,
        );
        commitHighlights(next, [action.highlight.page_number]);
        scheduleAnnotationSync();
        void deleteHighlightApi(action.highlight.id).catch((err) => {
          setMessage(err instanceof Error ? err.message : "Could not undo");
        });
      } else if (action.type === "delete_highlight") {
        const next = [...highlightsRef.current, action.highlight];
        commitHighlights(next, [action.highlight.page_number]);
        scheduleAnnotationSync();
        void upsertHighlight(action.highlight).catch((err) => {
          setMessage(err instanceof Error ? err.message : "Could not undo");
        });
      } else if (action.type === "batch_highlight") {
        let next = [...highlightsRef.current];
        for (const change of action.changes) {
          if (change.after === null) {
            if (!next.some((entry) => entry.id === change.before.id)) {
              next.push(change.before);
            }
          } else {
            const index = next.findIndex((entry) => entry.id === change.before.id);
            if (index >= 0) next[index] = change.before;
          }
        }
        const pages = [...new Set(action.changes.map((change) => change.before.page_number))];
        commitHighlights(next, pages);
        scheduleAnnotationSync();
        void Promise.all(
          action.changes.map((change) =>
            change.after === null
              ? upsertHighlight(change.before)
              : updateHighlight(change.before.id, change.before.position!),
          ),
        ).catch((err) => {
          setMessage(err instanceof Error ? err.message : "Could not undo");
        });
      } else if (action.type === "add_note") {
        setNotes((prev) => prev.filter((entry) => entry.id !== action.note.id));
        scheduleAnnotationSync();
        void deleteNoteApi(action.note.id).catch((err) => {
          setMessage(err instanceof Error ? err.message : "Could not undo");
        });
      } else if (action.type === "delete_note") {
        setNotes((prev) => [...prev, action.note]);
        scheduleAnnotationSync();
        void upsertNote(action.note).catch((err) => {
          setMessage(err instanceof Error ? err.message : "Could not undo");
        });
      }

      redoStackRef.current.push(action);
    } catch (err) {
      undoStackRef.current.push(action);
      setMessage(err instanceof Error ? err.message : "Could not undo");
    } finally {
      applyingHistoryRef.current = false;
    }
  }

  async function performRedo() {
    const action = redoStackRef.current.pop();
    if (!action) return;

    applyingHistoryRef.current = true;
    try {
      if (action.type === "add_highlight") {
        if (!highlightsRef.current.some((entry) => entry.id === action.highlight.id)) {
          const next = [...highlightsRef.current, action.highlight];
          commitHighlights(next, [action.highlight.page_number]);
        }
        scheduleAnnotationSync();
        void upsertHighlight(action.highlight).catch((err) => {
          setMessage(err instanceof Error ? err.message : "Could not redo");
        });
      } else if (action.type === "delete_highlight") {
        const next = highlightsRef.current.filter(
          (entry) => entry.id !== action.highlight.id,
        );
        commitHighlights(next, [action.highlight.page_number]);
        scheduleAnnotationSync();
        void deleteHighlightApi(action.highlight.id).catch((err) => {
          setMessage(err instanceof Error ? err.message : "Could not redo");
        });
      } else if (action.type === "batch_highlight") {
        const next = mergeHighlightChanges(highlightsRef.current, action.changes);
        const pages = [...new Set(action.changes.map((change) => change.before.page_number))];
        commitHighlights(next, pages);
        scheduleAnnotationSync();
        void Promise.all(
          action.changes.map((change) =>
            change.after === null
              ? deleteHighlightApi(change.before.id)
              : updateHighlight(change.after.id, change.after.position!),
          ),
        ).catch((err) => {
          setMessage(err instanceof Error ? err.message : "Could not redo");
        });
      } else if (action.type === "add_note") {
        setNotes((prev) => {
          if (prev.some((entry) => entry.id === action.note.id)) return prev;
          return [...prev, action.note];
        });
        scheduleAnnotationSync();
        void upsertNote(action.note).catch((err) => {
          setMessage(err instanceof Error ? err.message : "Could not redo");
        });
      } else if (action.type === "delete_note") {
        setNotes((prev) => prev.filter((entry) => entry.id !== action.note.id));
        scheduleAnnotationSync();
        void deleteNoteApi(action.note.id).catch((err) => {
          setMessage(err instanceof Error ? err.message : "Could not redo");
        });
      }

      undoStackRef.current.push(action);
    } catch (err) {
      redoStackRef.current.push(action);
      setMessage(err instanceof Error ? err.message : "Could not redo");
    } finally {
      applyingHistoryRef.current = false;
    }
  }

  keyboardHandlerRef.current = (event: KeyboardEvent) => {
    if (event.ctrlKey || event.metaKey) {
      if (!isNoteTextTarget(event.target)) {
        const isUndo = event.code === "KeyZ" && !event.shiftKey;
        const isRedo = event.code === "KeyY" || (event.code === "KeyZ" && event.shiftKey);

        if (isUndo) {
          event.preventDefault();
          event.stopPropagation();
          void performUndo();
          return;
        }

        if (isRedo) {
          event.preventDefault();
          event.stopPropagation();
          void performRedo();
          return;
        }
      }
    }

    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
    if (isNoteTextTarget(event.target)) return;
    if (!canNavigatePages()) return;

    event.preventDefault();
    if (event.key === "ArrowUp") goToPrevPageRef.current();
    else goToNextPageRef.current();
  };

  function getViewportSize(pageNumber: number) {
    const canvas = drawLayerRefs.current.get(pageNumber);
    if (!canvas) return null;
    return { viewportWidth: canvas.width, viewportHeight: canvas.height };
  }

  function applyEraserStroke(
    pageNumber: number,
    eraserPoints: Array<{ x: number; y: number }>,
  ) {
    finishEraserStroke(pageNumber, eraserPoints);
  }

  function saveStroke(
    pageNumber: number,
    stroke: HighlightStroke,
    highlightType: "freeform" | "pen",
  ) {
    const viewport = getViewportSize(pageNumber);
    const color = highlightType === "pen" ? penColor : highlightColor;
    const highlight: Highlight = {
      id: crypto.randomUUID(),
      book_id: bookId,
      user_id: userId,
      page_number: pageNumber,
      selected_text: "",
      color,
      highlight_type: highlightType,
      position: {
        strokes: [stroke],
        viewportWidth: viewport?.viewportWidth,
        viewportHeight: viewport?.viewportHeight,
      },
      created_at: new Date().toISOString(),
    };

    addHighlightOptimistic(highlight);
    pushHistory({ type: "add_highlight", highlight });
    if (highlightType === "pen") {
      pickPenColor(color);
    } else {
      pickHighlightColor(color);
    }

    void persistHighlight(highlight)
      .then(() => scheduleAnnotationSync())
      .catch((err) => {
        setMessage(err instanceof Error ? err.message : "Could not save mark");
      });
  }

  function saveShape(pageNumber: number, shape: HighlightShape, kind: ShapeKind) {
    const viewport = getViewportSize(pageNumber);
    const highlight: Highlight = {
      id: crypto.randomUUID(),
      book_id: bookId,
      user_id: userId,
      page_number: pageNumber,
      selected_text: "",
      color: penColor,
      highlight_type: shapeHighlightType(kind),
      position: {
        shape,
        viewportWidth: viewport?.viewportWidth,
        viewportHeight: viewport?.viewportHeight,
      },
      created_at: new Date().toISOString(),
    };

    addHighlightOptimistic(highlight);
    pushHistory({ type: "add_highlight", highlight });
    pickPenColor(penColor);

    void persistHighlight(highlight)
      .then(() => scheduleAnnotationSync())
      .catch((err) => {
        setMessage(err instanceof Error ? err.message : "Could not save shape");
      });
  }

  function getCanvasPoint(e: ReactPointerEvent<HTMLCanvasElement>) {
    return canvasPointFromClient(e.clientX, e.clientY, e.currentTarget);
  }

  function handleDrawPointerDown(
    e: ReactPointerEvent<HTMLCanvasElement>,
    pageNumber: number,
  ) {
    if (tool === "eraser") {
      isErasingRef.current = true;
      currentDrawPageRef.current = pageNumber;
      const point = getCanvasPoint(e);
      currentEraserPathRef.current = [point];
      eraserSessionRef.current = {
        pageNumber,
        baseline: highlightsRef.current.map((highlight) => ({
          ...highlight,
          position: highlight.position
            ? {
                ...highlight.position,
                strokes: highlight.position.strokes?.map((stroke) => ({
                  ...stroke,
                  points: stroke.points.map((p) => ({ ...p })),
                })),
                shape: highlight.position.shape
                  ? { ...highlight.position.shape }
                  : undefined,
              }
            : highlight.position,
        })),
      };
      previewEraser(pageNumber, point, e.clientX, e.clientY);
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }

    if (!isDrawingTool(tool)) return;
    isDrawingRef.current = true;
    currentDrawPageRef.current = pageNumber;
    const point = getCanvasPoint(e);

    if (tool === "shape") {
      const width = effectiveStrokeWidth(penStrokeWidth);
      currentShapeRef.current = {
        x1: point.x,
        y1: point.y,
        x2: point.x,
        y2: point.y,
        filled: shapeFilled,
        strokeWidth: width,
      };
      currentStrokeRef.current = null;
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }

    const width = effectiveStrokeWidth(
      tool === "pen" ? penStrokeWidth : highlightStrokeWidth,
    );
    currentStrokeRef.current = { points: [point], width };
    currentShapeRef.current = null;
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handleDrawPointerMove(e: ReactPointerEvent<HTMLCanvasElement>) {
    if (isErasingRef.current && tool === "eraser") {
      const pageNumber = currentDrawPageRef.current;
      if (pageNumber == null) return;

      const point = getCanvasPoint(e);
      const path = currentEraserPathRef.current;
      const last = path[path.length - 1];
      if (last && Math.hypot(point.x - last.x, point.y - last.y) < 1.5) {
        previewEraser(pageNumber, point, e.clientX, e.clientY);
        return;
      }
      path.push(point);
      liveApplyEraser(pageNumber, path);
      return;
    }

    if (!isDrawingRef.current || !isDrawingTool(tool)) return;
    const canvas = e.currentTarget;
    const pageNumber = currentDrawPageRef.current;
    if (!canvas || pageNumber == null) return;

    const point = getCanvasPoint(e);

    if (tool === "shape") {
      const shape = currentShapeRef.current;
      if (!shape) return;
      shape.x2 = point.x;
      shape.y2 = point.y;
      redrawHighlightLayer(canvas, highlightsRef.current, pageNumber, {
        shape,
        shapeKind,
        color: penColor,
        type: "shape",
      });
      return;
    }

    const stroke = currentStrokeRef.current;
    if (!stroke) return;

    const last = stroke.points[stroke.points.length - 1];
    if (Math.hypot(point.x - last.x, point.y - last.y) < 1.5) return;
    stroke.points.push(point);

    redrawHighlightLayer(canvas, highlightsRef.current, pageNumber, {
      stroke,
      color: tool === "pen" ? penColor : highlightColor,
      type: tool === "pen" ? "pen" : "freeform",
    });
  }

  function handleDrawPointerUp(
    e: ReactPointerEvent<HTMLCanvasElement>,
    pageNumber: number,
  ) {
    const canvas = e.currentTarget;
    if (canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }

    if (isErasingRef.current && tool === "eraser") {
      isErasingRef.current = false;
      const path = [...currentEraserPathRef.current];
      currentEraserPathRef.current = [];
      currentDrawPageRef.current = null;
      applyEraserStroke(pageNumber, path);
      return;
    }

    if (!isDrawingRef.current || !isDrawingTool(tool)) return;
    isDrawingRef.current = false;
    currentDrawPageRef.current = null;

    if (tool === "shape") {
      const shape = currentShapeRef.current;
      currentShapeRef.current = null;
      if (
        shape &&
        (Math.abs(shape.x2 - shape.x1) >= 4 || Math.abs(shape.y2 - shape.y1) >= 4)
      ) {
        saveShape(pageNumber, shape, shapeKind);
      }
      return;
    }

    const stroke = currentStrokeRef.current;
    const highlightType = tool === "pen" ? "pen" : "freeform";
    currentStrokeRef.current = null;

    if (stroke && stroke.points.length > 1) {
      saveStroke(pageNumber, stroke, highlightType);
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
      pushHistory({ type: "add_note", note: data });
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
    const note = notes.find((entry) => entry.id === id);
    if (note) {
      pushHistory({ type: "delete_note", note });
    }
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
    if (tool === "eraser" && !editingNoteId) {
      syncEraserOverlay(e.clientX, e.clientY);
    }

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
    scheduleScrollSync();
    scheduleProgressSaveFromScroll();
  }

  return (
    <div
      className="acrobat-reader fixed inset-0 z-40 flex flex-col outline-none"
      tabIndex={-1}
      onPointerDown={(e) => {
        if ((e.target as HTMLElement).closest("input, textarea, button, select, a")) {
          return;
        }
        e.currentTarget.focus({ preventScroll: true });
      }}
    >
      <ReaderTopBar
        bookId={bookId}
        title={bookTitle}
        saving={saving}
        saveLabel={saveLabel}
        pageBookmarked={bookmarks.some((bookmark) => bookmark.page_number === page)}
        bookmarkPulse={bookmarkPulse}
        onSave={() => void handleSave()}
        onBookmark={() => selectTool("bookmark", { force: true })}
      />

      {(offline || message) && (
        <div className="shrink-0 space-y-1 border-b border-white/10 px-3 py-1.5 text-xs">
          {offline && (
            <p className="text-white/60">
              Offline. Changes sync when you are back online.
            </p>
          )}
          {message && <p className="text-amber-300">{message}</p>}
        </div>
      )}

      <div className="relative min-h-0 flex-1">
        {eraserOverlay && tool === "eraser" && (
          <EraserCursorOverlay
            x={eraserOverlay.x}
            y={eraserOverlay.y}
            diameter={eraserOverlay.diameter}
          />
        )}
        <LeftToolbar
          tool={tool}
          onSelectTool={selectTool}
          anchorPageWidth={pageSlotSize?.width ?? null}
          highlightColor={highlightColor}
          penColor={penColor}
          recentHighlightColors={recentHighlightColors}
          recentPenColors={recentPenColors}
          onPickHighlightColor={pickHighlightColor}
          onCommitHighlightColor={commitHighlightColor}
          onHighlightColorChange={setHighlightColor}
          onPickPenColor={pickPenColor}
          onCommitPenColor={commitPenColor}
          onPenColorChange={setPenColor}
          noteTextColor={noteTextColor}
          noteFontSize={noteFontSize}
          editingNote={Boolean(editingNoteId)}
          onPickNoteColor={pickNoteColor}
          onAdjustNoteFontSize={adjustNoteFontSize}
          highlightStrokeWidth={highlightStrokeWidth}
          penStrokeWidth={penStrokeWidth}
          eraserStrokeWidth={eraserStrokeWidth}
          onHighlightStrokeWidthChange={setHighlightStrokeWidthAndSave}
          onPenStrokeWidthChange={setPenStrokeWidthAndSave}
          onEraserStrokeWidthChange={setEraserStrokeWidthAndSave}
          shapeKind={shapeKind}
          shapeFilled={shapeFilled}
          onShapeKindChange={(kind) => {
            setShapeKind(kind);
            saveShapeKind(kind);
          }}
          onShapeFilledChange={(filled) => {
            setShapeFilled(filled);
            saveShapeFilled(filled);
          }}
        />

        {tool === "bookmark" && !bookmarkToDelete && (
          <BookmarkAddPanel
            page={page}
            color={bookmarkColor}
            label={bookmarkLabel}
            onColorChange={setBookmarkColor}
            onLabelChange={(value) => setBookmarkLabel(normalizeBookmarkLabel(value))}
            onAdd={() => void handleAddBookmark()}
            onClose={() => setTool("read")}
          />
        )}

        {bookmarkToDelete && (
          <BookmarkDeleteConfirm
            label={bookmarkToDelete.label || `Page ${bookmarkToDelete.page_number}`}
            onConfirm={() => void handleConfirmDeleteBookmark()}
            onCancel={() => setBookmarkToDelete(null)}
          />
        )}

        {showResumeOverlay && !resumeReady && (
          <ContinueReadingPrompt
            page={initialPage}
            zoomPercent={Math.round((initialZoom ?? zoomMultiplier) * 100)}
            onContinue={() => {
              setShowResumeOverlay(false);
              setResumeReady(true);
            }}
            onStartOver={() => {
              setShowResumeOverlay(false);
              setResumeReady(true);
              scrollToPage(1, "auto");
            }}
          />
        )}

        {showReadAgainOverlay && !resumeReady && (
          <ReadAgainPrompt
            readCount={readCount}
            onReadAgain={() => {
              void resetBookForReread(bookId).then(() => {
                setShowReadAgainOverlay(false);
                setResumeReady(true);
                setPage(1);
                scrollToPage(1, "auto");
              });
            }}
            onOpenLastPage={() => {
              setShowReadAgainOverlay(false);
              setResumeReady(true);
              scrollToPage(initialPage, "auto");
            }}
          />
        )}

        <div
          ref={viewerRef}
          tabIndex={-1}
          className={cn(
            "acrobat-viewport h-full overflow-auto outline-none",
            tool === "pan" && "cursor-grab active:cursor-grabbing",
            tool === "eraser" && !editingNoteId && "cursor-none",
          )}
          onPointerDown={(e) => {
            handleViewerPointerDown(e);
            if (tool !== "pan" || editingNoteId) {
              e.currentTarget.focus({ preventScroll: true });
            }
          }}
          onPointerMove={handleViewerPointerMove}
          onPointerUp={handleViewerPointerUp}
          onPointerCancel={handleViewerPointerUp}
          onPointerLeave={(e) => {
            if (tool === "eraser" && e.currentTarget === viewerRef.current) {
              setEraserOverlay(null);
            }
          }}
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
            className="mx-auto flex w-full max-w-full flex-col items-center gap-2.5 py-4"
            style={{ visibility: loading || error ? "hidden" : "visible" }}
          >
            {Array.from({ length: maxPage }, (_, index) => {
              const pageNumber = index + 1;
              const slotWidth = pageSlotSize?.width ?? 420;
              const slotHeight = pageSlotSize?.height ?? 594;
              const pageBookmarks = bookmarks.filter(
                (bookmark) => bookmark.page_number === pageNumber,
              );

              return (
                <div
                  key={pageNumber}
                  data-page={pageNumber}
                  ref={bindMapRef(pageWrapRefs, pageNumber)}
                  className={cn(
                    "relative w-fit",
                    tool === "note" && !editingNoteId && "cursor-crosshair",
                    tool === "eraser" && !editingNoteId && "cursor-none",
                  )}
                  onPointerDown={(e) => handleContainerPointerDown(e, pageNumber)}
                >
                  {pageBookmarks.map((bookmark, bookmarkIndex) => (
                    <PageBookmarkRibbon
                      key={bookmark.id}
                      colorId={bookmark.color}
                      label={bookmark.label || `Page ${pageNumber}`}
                      offsetIndex={bookmarkIndex}
                      onClick={() => jumpToBookmark(bookmark)}
                      onDoubleClick={() => setBookmarkToDelete(bookmark)}
                    />
                  ))}
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
                          isInteractiveDrawLayer(tool) && tool !== "eraser"
                            ? "cursor-crosshair"
                            : tool === "eraser"
                              ? "cursor-none"
                              : "pointer-events-none",
                        )}
                        onPointerDown={(e) => handleDrawPointerDown(e, pageNumber)}
                        onPointerMove={(e) => {
                          if (tool === "eraser") {
                            syncEraserOverlay(e.clientX, e.clientY);
                          }
                          handleDrawPointerMove(e);
                        }}
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
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
        />
      </div>
    </div>
  );
}
