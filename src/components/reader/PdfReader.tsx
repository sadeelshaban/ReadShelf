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
import {
  scaleShape,
  shapeHighlightType,
  translateShape,
} from "@/lib/reader/shapes";
import { redrawHighlightLayer, compositeHighlightLayer, syncHighlightBackup } from "@/lib/reader/pdf-reader-canvas";
import {
  DEFAULT_ZOOM,
  MAX_RENDER_PIXEL_SCALE,
  MAX_ZOOM,
  MIN_ZOOM,
  PROGRAMMATIC_SCROLL_TIMEOUT_MS,
  READING_IDLE_SAVE_MS,
  SCROLL_PROGRESS_DEBOUNCE_MS,
  SCROLL_SYNC_DEBOUNCE_MS,
  WHEEL_ZOOM_SENSITIVITY,
  ZOOM_BUTTON_FACTOR,
  ZOOM_COMMIT_MS,
} from "@/lib/reader/pdf-reader-config";
import {
  bindMapRef,
  canvasRefForPage,
  isTouchDevice,
} from "@/lib/reader/pdf-reader-dom";
import {
  type HighlightChange,
  type HistoryAction,
  applyHistoryRedo,
  applyHistoryUndo,
  mergeHighlightChanges,
} from "@/lib/reader/pdf-reader-history";
import {
  mergeRenderedPages,
  resolveVisiblePage,
  scrollViewerToPage,
} from "@/lib/reader/pdf-reader-scroll";
import {
  applyZoomAnchor,
  captureZoomAnchor,
  type ZoomAnchor,
} from "@/lib/reader/pdf-reader-zoom";
import {
  canNavigatePages as canNavigatePagesCheck,
  isDrawingTool,
  isInteractiveDrawLayer,
  isNoteTextTarget,
} from "@/lib/reader/pdf-reader-tools";
import { findNoteAtPoint, findShapeAtPoint } from "@/lib/reader/hit-test";
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
import { LeftToolbar } from "@/components/reader/ReaderToolbars";
import { EraserCursorOverlay } from "@/components/reader/EraserCursorOverlay";
import { ReaderStatusBar } from "@/components/reader/ReaderStatusBar";
import { ReaderTopBar } from "@/components/reader/ReaderTopBar";
import { PageBookmarkRibbon } from "@/components/reader/PageBookmarkRibbon";
import {
  BookmarkAddPanel,
  BookmarkDeleteConfirm,
} from "@/components/reader/BookmarkAddPanel";
import { ContinueReadingPrompt } from "@/components/reader/ContinueReadingPrompt";
import { PageNote, type StickyNoteDraft } from "@/components/reader/PageNote";
import { PageComment } from "@/components/reader/PageComment";
import {
  DEFAULT_COMMENT_HEIGHT,
  DEFAULT_COMMENT_WIDTH,
  DEFAULT_STICKY_COLOR,
  DEFAULT_STICKY_HEIGHT,
  DEFAULT_STICKY_WIDTH,
  isCommentNote,
  isNoteOnPage,
  isStickyNote,
  noteHasContent,
  noteOverflowExtent,
  noteTitle,
  normalizeStickyColor,
  OFF_PAGE_NOTE_EXPORT_NOTICE,
} from "@/lib/reader/sticky-notes";
import { ReadAgainPrompt } from "@/components/reader/ReadAgainPrompt";
import { LoadingState } from "@/components/ui/LoadingState";
import type { BookmarkColorId } from "@/lib/reader/bookmarks";
import { normalizeBookmarkLabel } from "@/lib/reader/bookmarks";
import {
  loadReaderDarkMode,
  loadReaderFocusMode,
  saveReaderDarkMode,
  saveReaderFocusMode,
} from "@/lib/reader/reader-theme";
import {
  fetchReaderDarkModePreference,
  syncReaderDarkModePreference,
} from "@/lib/reader/reader-preferences-api";
import { cn } from "@/lib/utils";

type PdfReaderProps = {
  bookId: string;
  bookTitle: string;
  userId: string;
  initialPage: number;
  initialScrollY: number | null;
  initialZoom: number | null;
  focusNoteId?: string | null;
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
  focusNoteId = null,
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
  const historyChainRef = useRef<Promise<void>>(Promise.resolve());
  const shapeDragRef = useRef<{
    pageNumber: number;
    highlightId: string;
    startPoint: { x: number; y: number };
    originShape: HighlightShape;
    before: Highlight;
    moved: boolean;
  } | null>(null);
  const eraserStrokeWidthRef = useRef(loadEraserStrokeWidth());
  const skipHighlightRedrawRef = useRef<Set<number>>(new Set());
  const drawDraftRef = useRef<{
    pageNumber: number;
    draft: {
      stroke?: HighlightStroke;
      shape?: HighlightShape;
      shapeKind?: ShapeKind;
      color: string;
      type: "freeform" | "pen" | "shape";
    };
  } | null>(null);
  const drawBackupRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const drawBackupFrozenRef = useRef(false);
  const drawFrameRef = useRef<number | null>(null);
  const pendingDrawPageRef = useRef<number | null>(null);
  const pendingEraserPreviewRef = useRef<
    { x: number; y: number; diameter: number } | undefined
  >(undefined);
  const highlightsRef = useRef(initialHighlights);
  const notesRef = useRef(initialNotes);
  const editingDraftRef = useRef<{ title: string; body: string }>({
    title: "",
    body: "",
  });
  const noteHadContentRef = useRef(false);
  const finishNoteRef = useRef<(id: string, draft: { title: string; body: string }) => void>(
    () => {},
  );
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
  const zoomAnchorRef = useRef<ZoomAnchor | null>(null);
  const zoomMultiplierRef = useRef(initialZoom ?? DEFAULT_ZOOM);
  /** Committed layout zoom — live gestures preview via CSS transform until bake. */
  const committedZoomRef = useRef(initialZoom ?? DEFAULT_ZOOM);
  const liveZoomRef = useRef(initialZoom ?? DEFAULT_ZOOM);
  const zoomPreviewRef = useRef(1);
  const zoomPointerRef = useRef<{ clientX: number; clientY: number } | null>(null);
  const zoomSpacerRef = useRef<HTMLDivElement>(null);
  const zoomLayerRef = useRef<HTMLDivElement>(null);
  const pageSlotSizeRef = useRef<{ width: number; height: number } | null>(null);
  const zoomWheelDeltaRef = useRef(0);
  const zoomWheelAnchorRef = useRef<{ clientX: number; clientY: number } | null>(null);
  const zoomWheelFrameRef = useRef<number | null>(null);
  const zoomCommitTimerRef = useRef<number | null>(null);
  const lastRenderedZoomRef = useRef<Map<number, number>>(new Map());
  const panRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    scrollLeft: number;
    scrollTop: number;
    lastX: number;
    lastY: number;
    lastTime: number;
    vx: number;
    vy: number;
  } | null>(null);
  const panMoveFrameRef = useRef<number | null>(null);
  const panPendingPointRef = useRef<{ clientX: number; clientY: number } | null>(null);
  const panMomentumFrameRef = useRef<number | null>(null);
  const resumeActionRef = useRef<"continue" | "start-over">("continue");

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
  const [zoomPercentUi, setZoomPercentUi] = useState(() =>
    Math.round((initialZoom ?? DEFAULT_ZOOM) * 100),
  );
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
  const [darkMode, setDarkMode] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [statusActivity, setStatusActivity] = useState(0);
  const [resumeReady, setResumeReady] = useState(!showResumePrompt && !showReadAgainPrompt);
  const [showResumeOverlay, setShowResumeOverlay] = useState(showResumePrompt);
  const [showReadAgainOverlay, setShowReadAgainOverlay] = useState(showReadAgainPrompt);
  const [message, setMessage] = useState<string | null>(null);
  const [infoToast, setInfoToast] = useState<string | null>(null);
  const infoToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const focusedNoteRef = useRef(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteTextColor, setNoteTextColor] = useState(DEFAULT_STICKY_COLOR);
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
  notesRef.current = notes;
  toolRef.current = tool;
  editingNoteIdRef.current = editingNoteId;
  pageRef.current = page;
  eraserStrokeWidthRef.current = eraserStrokeWidth;
  // zoomMultiplierRef / pageSlotSizeRef are owned by live zoom + commit paths —
  // do not reset them from React state on every render (that fights mid-gesture zoom).

  const maxPage = pdfNumPages ?? totalPages ?? page;
  maxPageRef.current = maxPage;

  const bumpStatusActivity = useCallback(() => {
    setStatusActivity((current) => current + 1);
  }, []);

  useEffect(() => {
    const localDark = loadReaderDarkMode();
    setDarkMode(localDark);
    setFocusMode(loadReaderFocusMode());
    void syncReaderDarkModePreference(localDark);

    void fetchReaderDarkModePreference().then((serverDark) => {
      if (serverDark === null || serverDark === localDark) return;
      setDarkMode(serverDark);
      saveReaderDarkMode(serverDark);
    });
  }, []);

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

  const applyLiveZoomPreview = useCallback(
    (nextPreview: number, pointer: { clientX: number; clientY: number }) => {
      const viewer = viewerRef.current;
      const layer = zoomLayerRef.current;
      const spacer = zoomSpacerRef.current;
      if (!viewer || !layer || !spacer) return;

      const prevPreview = zoomPreviewRef.current;
      const rect = viewer.getBoundingClientRect();
      const ox = pointer.clientX - rect.left;
      const oy = pointer.clientY - rect.top;
      const contentX = (viewer.scrollLeft + ox) / prevPreview;
      const contentY = (viewer.scrollTop + oy) / prevPreview;

      // GPU path: one transform + spacer size — no per-page layout thrash.
      const naturalW = layer.offsetWidth;
      const naturalH = layer.offsetHeight;
      layer.style.transform = nextPreview === 1 ? "" : `scale(${nextPreview})`;
      layer.style.transformOrigin = "0 0";
      spacer.style.width = `${Math.max(naturalW * nextPreview, viewer.clientWidth)}px`;
      spacer.style.height = `${naturalH * nextPreview}px`;

      viewer.scrollLeft = contentX * nextPreview - ox;
      viewer.scrollTop = contentY * nextPreview - oy;
      zoomPreviewRef.current = nextPreview;
    },
    [],
  );

  const bakeZoomPreview = useCallback(() => {
    const viewer = viewerRef.current;
    const layer = zoomLayerRef.current;
    const spacer = zoomSpacerRef.current;
    if (!viewer || !layer || !spacer) return;

    const live = liveZoomRef.current;
    const committed = committedZoomRef.current;
    const preview = zoomPreviewRef.current;
    const ratio = live / committed;
    if (Math.abs(ratio - 1) < 0.0002 && preview === 1) {
      setZoomPercentUi(Math.round(live * 100));
      return;
    }

    const pointer = zoomPointerRef.current;
    const rect = viewer.getBoundingClientRect();
    const ox = pointer ? pointer.clientX - rect.left : rect.width / 2;
    const oy = pointer ? pointer.clientY - rect.top : rect.height / 2;
    const contentX = (viewer.scrollLeft + ox) / preview;
    const contentY = (viewer.scrollTop + oy) / preview;

    const slot = pageSlotSizeRef.current;
    if (slot) {
      pageSlotSizeRef.current = {
        width: slot.width * ratio,
        height: slot.height * ratio,
      };
    }

    for (const [pageNumber, canvas] of canvasRefs.current) {
      const w = Number.parseFloat(canvas.style.width);
      const h = Number.parseFloat(canvas.style.height);
      if (w > 0 && h > 0) {
        canvas.style.width = `${w * ratio}px`;
        canvas.style.height = `${h * ratio}px`;
      }
      const drawLayer = drawLayerRefs.current.get(pageNumber);
      if (drawLayer) {
        const dw = Number.parseFloat(drawLayer.style.width);
        const dh = Number.parseFloat(drawLayer.style.height);
        if (dw > 0 && dh > 0) {
          drawLayer.style.width = `${dw * ratio}px`;
          drawLayer.style.height = `${dh * ratio}px`;
        }
      }
    }

    for (const [pageNumber, wrap] of pageWrapRefs.current) {
      if (canvasRefs.current.has(pageNumber)) continue;
      const placeholder = wrap.firstElementChild as HTMLElement | null;
      const nextSlot = pageSlotSizeRef.current;
      if (placeholder && nextSlot) {
        placeholder.style.width = `${nextSlot.width}px`;
        placeholder.style.height = `${nextSlot.height}px`;
      }
    }

    layer.style.transform = "";
    spacer.style.width = "";
    spacer.style.height = "";
    zoomPreviewRef.current = 1;
    committedZoomRef.current = live;
    zoomMultiplierRef.current = live;

    viewer.scrollLeft = contentX * ratio - ox;
    viewer.scrollTop = contentY * ratio - oy;

    // Re-pin after layout (centering / note remount) using page-relative anchor.
    if (pointer) {
      zoomAnchorRef.current = captureZoomAnchor(
        pointer.clientX,
        pointer.clientY,
        pageWrapRefs.current,
        pageRef.current,
      );
      requestAnimationFrame(() => {
        const anchor = zoomAnchorRef.current;
        if (anchor && viewerRef.current) {
          applyZoomAnchor(viewerRef.current, pageWrapRefs.current, anchor);
        }
        zoomAnchorRef.current = null;
      });
    }

    setZoomMultiplier(live);
    setZoomPercentUi(Math.round(live * 100));
    if (pageSlotSizeRef.current) {
      setPageSlotSize({ ...pageSlotSizeRef.current });
    }
  }, []);

  const changeZoom = useCallback(
    (
      deltaOrTarget: number | ((current: number) => number),
      pointer?: { clientX: number; clientY: number },
      options?: { commit?: "immediate" | "debounce" },
    ) => {
      const viewer = viewerRef.current;
      if (!viewer) return;

      const current = liveZoomRef.current;
      const raw =
        typeof deltaOrTarget === "function" ? deltaOrTarget(current) : deltaOrTarget;
      const clamped = Math.min(
        MAX_ZOOM,
        Math.max(MIN_ZOOM, Number(raw.toFixed(4))),
      );
      if (Math.abs(clamped - current) < 0.0002) return;

      liveZoomRef.current = clamped;
      zoomMultiplierRef.current = clamped;

      const rect = viewer.getBoundingClientRect();
      const pointerX = pointer?.clientX ?? rect.left + rect.width / 2;
      const pointerY = pointer?.clientY ?? rect.top + rect.height / 2;
      zoomPointerRef.current = { clientX: pointerX, clientY: pointerY };

      // Before the pages layer mounts, fall back to a direct state update.
      if (!zoomLayerRef.current || !zoomSpacerRef.current) {
        committedZoomRef.current = clamped;
        zoomPreviewRef.current = 1;
        setZoomMultiplier(clamped);
        setZoomPercentUi(Math.round(clamped * 100));
        return;
      }

      const preview = clamped / committedZoomRef.current;
      applyLiveZoomPreview(preview, { clientX: pointerX, clientY: pointerY });

      const mode = options?.commit ?? "immediate";
      if (mode === "immediate") {
        if (zoomCommitTimerRef.current != null) {
          window.clearTimeout(zoomCommitTimerRef.current);
          zoomCommitTimerRef.current = null;
        }
        bakeZoomPreview();
        return;
      }

      if (zoomCommitTimerRef.current != null) {
        window.clearTimeout(zoomCommitTimerRef.current);
      }
      zoomCommitTimerRef.current = window.setTimeout(() => {
        zoomCommitTimerRef.current = null;
        bakeZoomPreview();
      }, ZOOM_COMMIT_MS);
    },
    [applyLiveZoomPreview, bakeZoomPreview],
  );

  const zoomIn = useCallback(() => {
    const viewer = viewerRef.current;
    if (!viewer) {
      changeZoom((current) => current * ZOOM_BUTTON_FACTOR, undefined, {
        commit: "debounce",
      });
      return;
    }
    const rect = viewer.getBoundingClientRect();
    changeZoom((current) => current * ZOOM_BUTTON_FACTOR, {
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2,
    }, { commit: "debounce" });
  }, [changeZoom]);

  const zoomOut = useCallback(() => {
    const viewer = viewerRef.current;
    if (!viewer) {
      changeZoom((current) => current / ZOOM_BUTTON_FACTOR, undefined, {
        commit: "debounce",
      });
      return;
    }
    const rect = viewer.getBoundingClientRect();
    changeZoom((current) => current / ZOOM_BUTTON_FACTOR, {
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2,
    }, { commit: "debounce" });
  }, [changeZoom]);

  const setZoomPercent = useCallback(
    (percent: number) => {
      const viewer = viewerRef.current;
      const target = percent / 100;
      if (!viewer) {
        changeZoom(target, undefined, { commit: "immediate" });
        return;
      }
      const rect = viewer.getBoundingClientRect();
      changeZoom(target, {
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2,
      }, { commit: "immediate" });
    },
    [changeZoom],
  );

  function canNavigatePages() {
    return canNavigatePagesCheck({
      editingNoteId: editingNoteIdRef.current,
      isDrawing: isDrawingRef.current,
      isErasing: isErasingRef.current,
      activeTool: toolRef.current,
    });
  }

  useEffect(() => {
    const viewerEl = viewerRef.current;
    if (!viewerEl) return;

    function flushWheelZoom() {
      zoomWheelFrameRef.current = null;
      const dy = zoomWheelDeltaRef.current;
      const anchor = zoomWheelAnchorRef.current;
      zoomWheelDeltaRef.current = 0;
      zoomWheelAnchorRef.current = null;
      if (!dy || !anchor) return;

      const factor = Math.exp(-dy * WHEEL_ZOOM_SENSITIVITY);
      changeZoom((current) => current * factor, anchor, { commit: "debounce" });
    }

    function onWheel(e: WheelEvent) {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const shell = viewerRef.current;
      const unit =
        e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? (shell?.clientHeight ?? 1) : 1;
      zoomWheelDeltaRef.current += e.deltaY * unit;
      zoomWheelAnchorRef.current = { clientX: e.clientX, clientY: e.clientY };
      if (zoomWheelFrameRef.current == null) {
        zoomWheelFrameRef.current = requestAnimationFrame(flushWheelZoom);
      }
    }

    viewerEl.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      viewerEl.removeEventListener("wheel", onWheel);
      if (zoomWheelFrameRef.current != null) {
        cancelAnimationFrame(zoomWheelFrameRef.current);
        zoomWheelFrameRef.current = null;
      }
      if (zoomCommitTimerRef.current != null) {
        window.clearTimeout(zoomCommitTimerRef.current);
        zoomCommitTimerRef.current = null;
      }
      if (panMomentumFrameRef.current != null) {
        cancelAnimationFrame(panMomentumFrameRef.current);
        panMomentumFrameRef.current = null;
      }
      if (panMoveFrameRef.current != null) {
        cancelAnimationFrame(panMoveFrameRef.current);
        panMoveFrameRef.current = null;
      }
    };
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

      if (resumeActionRef.current === "start-over") {
        resumeActionRef.current = "continue";
        programmaticScrollTargetRef.current = 1;
        setPage(1);
        setRenderedPages((prev) => mergeRenderedPages(prev, 1, maxPageRef.current));

        const attemptScroll = (retriesLeft: number) => {
          const pageWrap = pageWrapRefs.current.get(1);
          if (pageWrap) {
            scrollViewerToPage(viewer, pageWrap, behavior);
            viewer.scrollTop = 0;
            return;
          }
          if (retriesLeft > 0) {
            requestAnimationFrame(() => attemptScroll(retriesLeft - 1));
          }
        };

        requestAnimationFrame(() => attemptScroll(24));

        void saveReadingProgress(bookId, 1, totalPages ?? pdfNumPages, {
          scrollY: 0,
          zoom: zoomMultiplierRef.current,
        });

        window.setTimeout(() => {
          programmaticScrollTargetRef.current = null;
          syncPageFromScroll({ force: true });
        }, behavior === "smooth" ? PROGRAMMATIC_SCROLL_TIMEOUT_MS : 150);
        return;
      }

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
    [
      bookId,
      initialPage,
      initialScrollY,
      pdfNumPages,
      restoreScrollPosition,
      syncPageFromScroll,
      totalPages,
    ],
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

    const generation = (renderGenRef.current.get(pageNumber) ?? 0) + 1;
    renderGenRef.current.set(pageNumber, generation);
    renderTasksRef.current.get(pageNumber)?.cancel();

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    // Cap bitmap scale so zoomed-in scrolling stays fluid on the main thread.
    const renderScale = Math.min(zoom * dpr, MAX_RENDER_PIXEL_SCALE);

    let pdfPage;
    try {
      pdfPage = await pdf.getPage(pageNumber);
    } catch (err) {
      if (generation !== renderGenRef.current.get(pageNumber)) return;
      throw err;
    }
    if (generation !== renderGenRef.current.get(pageNumber)) return;

    const cssViewport = pdfPage.getViewport({ scale: zoom });
    const cssWidth = cssViewport.width;
    const cssHeight = cssViewport.height;
    const viewport = pdfPage.getViewport({ scale: renderScale });
    const pixelWidth = viewport.width;
    const pixelHeight = viewport.height;

    const alreadyRendered =
      lastRenderedZoomRef.current.get(pageNumber) === zoom &&
      canvas.width === pixelWidth &&
      canvas.height === pixelHeight &&
      Math.abs(Number.parseFloat(canvas.style.width) - cssWidth) < 0.5;
    if (alreadyRendered) return;

    // Apply CSS size immediately so layout stays correct while PDF paints.
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;
    drawLayer.style.width = `${cssWidth}px`;
    drawLayer.style.height = `${cssHeight}px`;

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
      if (
        name === "RenderingCancelledException" ||
        name === "AbortException" ||
        generation !== renderGenRef.current.get(pageNumber)
      ) {
        return;
      }
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

      if (
        drawLayer.width !== pixelWidth ||
        drawLayer.height !== pixelHeight
      ) {
        drawLayer.width = pixelWidth;
        drawLayer.height = pixelHeight;
      }
    }

    // Re-assert CSS after bitmap resize (setting width/height can reset style in some browsers).
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;
    drawLayer.style.width = `${cssWidth}px`;
    drawLayer.style.height = `${cssHeight}px`;

    context.drawImage(scratch, 0, 0);

    lastRenderedZoomRef.current.set(pageNumber, zoom);

    if (pageNumber === pageRef.current) {
      setPageSlotSize((prev) => {
        if (
          prev &&
          Math.abs(prev.width - cssWidth) < 0.5 &&
          Math.abs(prev.height - cssHeight) < 0.5
        ) {
          return prev;
        }
        const next = { width: cssWidth, height: cssHeight };
        pageSlotSizeRef.current = next;
        return next;
      });
      setPageViewport((prev) => {
        if (prev.width === pixelWidth && prev.height === pixelHeight) {
          return prev;
        }
        return { width: pixelWidth, height: pixelHeight };
      });
    }

    redrawPageHighlights(pageNumber, highlightsRef.current);
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
    // Skip PDF redraw while a live CSS-zoom preview is active.
    if (zoomPreviewRef.current !== 1) return;

    const zoom = fitScale * zoomMultiplier;
    const currentPage = pageRef.current;
    const pages = [...renderedPages].sort((a, b) => {
      if (a === currentPage) return -1;
      if (b === currentPage) return 1;
      return Math.abs(a - currentPage) - Math.abs(b - currentPage);
    });

    let cancelled = false;

    async function renderQueue() {
      for (let i = 0; i < pages.length; i += 1) {
        if (cancelled) return;
        const pageNumber = pages[i]!;
        try {
          await renderPage(pageNumber, zoom);
          if (!cancelled) setError(null);
        } catch (err) {
          if (cancelled) return;
          const name = err instanceof Error ? err.name : "";
          if (name === "RenderingCancelledException" || name === "AbortException") {
            continue;
          }
          setError(err instanceof Error ? err.message : "Failed to render page");
          return;
        }
        // Yield longer after the visible page so zoom/scroll stay fluid.
        const delayFrames = i === 0 ? 1 : 2;
        for (let f = 0; f < delayFrames; f += 1) {
          await new Promise<void>((resolve) => {
            requestAnimationFrame(() => resolve());
          });
        }
      }
    }

    void renderQueue();

    return () => {
      cancelled = true;
    };
  }, [renderedPages, fitScale, fitScaleReady, zoomMultiplier, renderPage, loading]);

  useEffect(() => {
    if (isDrawingRef.current || isErasingRef.current) return;

    for (const pageNumber of renderedPages) {
      if (skipHighlightRedrawRef.current.has(pageNumber)) continue;
      redrawPageHighlights(pageNumber, highlights);
    }
    skipHighlightRedrawRef.current.clear();
  }, [highlights, renderedPages]);

  function getDrawBackup(pageNumber: number) {
    const drawLayer = drawLayerRefs.current.get(pageNumber);
    if (!drawLayer) return null;

    let backup = drawBackupRefs.current.get(pageNumber);
    if (!backup) {
      backup = document.createElement("canvas");
      drawBackupRefs.current.set(pageNumber, backup);
    }
    if (backup.width !== drawLayer.width || backup.height !== drawLayer.height) {
      backup.width = drawLayer.width;
      backup.height = drawLayer.height;
    }
    return backup;
  }

  function syncDrawBackup(pageNumber: number, list: Highlight[], force = false) {
    if (drawBackupFrozenRef.current && !force) return;
    const drawLayer = drawLayerRefs.current.get(pageNumber);
    const backup = getDrawBackup(pageNumber);
    if (!drawLayer || !backup) return;
    syncHighlightBackup(backup, list, pageNumber, drawLayer);
  }

  function paintDrawLayer(
    pageNumber: number,
    list: Highlight[],
    eraserPreview?: { x: number; y: number; diameter: number },
  ) {
    const drawLayer = drawLayerRefs.current.get(pageNumber);
    const backup = getDrawBackup(pageNumber);
    if (!drawLayer || !backup) return;

    const activeDraft = drawDraftRef.current;
    const draft =
      activeDraft?.pageNumber === pageNumber ? activeDraft.draft : undefined;

    const interacting =
      (isDrawingRef.current || isErasingRef.current) &&
      currentDrawPageRef.current === pageNumber;

    if (interacting) {
      compositeHighlightLayer(drawLayer, backup, draft, eraserPreview);
      return;
    }

    redrawHighlightLayer(drawLayer, list, pageNumber, draft, eraserPreview);
    syncDrawBackup(pageNumber, list, true);
  }

  function scheduleDrawLayerPaint(
    pageNumber: number,
    eraserPreview?: { x: number; y: number; diameter: number },
  ) {
    pendingDrawPageRef.current = pageNumber;
    pendingEraserPreviewRef.current = eraserPreview;

    if (drawFrameRef.current != null) return;

    drawFrameRef.current = requestAnimationFrame(() => {
      drawFrameRef.current = null;
      const page = pendingDrawPageRef.current;
      if (page == null) return;
      paintDrawLayer(page, highlightsRef.current, pendingEraserPreviewRef.current);
      pendingEraserPreviewRef.current = undefined;
    });
  }

  function redrawPageHighlights(
    pageNumber: number,
    list: Highlight[],
    eraserPreview?: { x: number; y: number; diameter: number },
  ) {
    paintDrawLayer(pageNumber, list, eraserPreview);
  }

  function clearDrawDraft(pageNumber?: number) {
    if (pageNumber == null || drawDraftRef.current?.pageNumber === pageNumber) {
      drawDraftRef.current = null;
    }
  }

  function eraserPreviewAt(point: { x: number; y: number }) {
    return {
      x: point.x,
      y: point.y,
      diameter: effectiveStrokeWidth(eraserStrokeWidthRef.current),
    };
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
    scheduleDrawLayerPaint(pageNumber, eraserPreviewAt(point));
  }

  function liveApplyEraser(pageNumber: number, eraserPath: Array<{ x: number; y: number }>) {
    const session = eraserSessionRef.current;
    if (!session || session.pageNumber !== pageNumber) return;

    const drawLayer = drawLayerRefs.current.get(pageNumber);
    if (!drawLayer) return;

    const changes = computeEraserChanges(
      session.baseline,
      pageNumber,
      eraserPath,
      eraserStrokeWidthRef.current,
      drawLayer.width,
      drawLayer.height,
    );
    const next = applyEraserChanges(session.baseline, changes);
    highlightsRef.current = next;
    syncDrawBackup(pageNumber, next, true);

    const cursor = eraserCursorRef.current;
    scheduleDrawLayerPaint(
      pageNumber,
      cursor ? eraserPreviewAt(cursor) : undefined,
    );
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

    const drawLayer = drawLayerRefs.current.get(pageNumber);
    if (!drawLayer) {
      highlightsRef.current = session.baseline;
      commitHighlights(session.baseline, [pageNumber]);
      return;
    }

    const changes = computeEraserChanges(
      session.baseline,
      pageNumber,
      eraserPath,
      eraserStrokeWidthRef.current,
      drawLayer.width,
      drawLayer.height,
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
    if (!focusNoteId || focusedNoteRef.current || loading || !resumeReady) return;

    const target = notesRef.current.find((entry) => entry.id === focusNoteId);
    if (target) {
      setRenderedPages((prev) =>
        mergeRenderedPages(prev, target.page_number, maxPageRef.current),
      );
      scrollToPage(target.page_number, "auto");
    }

    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const tryFocus = () => {
      if (cancelled || focusedNoteRef.current) return;
      const el = document.querySelector(
        `[data-note-id="${CSS.escape(focusNoteId)}"]`,
      );
      if (el instanceof HTMLElement) {
        focusedNoteRef.current = true;
        el.scrollIntoView({ block: "center", inline: "center", behavior: "smooth" });
        el.classList.add("reader-note-focus");
        window.setTimeout(() => el.classList.remove("reader-note-focus"), 1800);
        return;
      }
      attempts += 1;
      if (attempts < 60) {
        timer = setTimeout(tryFocus, 50);
      }
    };

    timer = setTimeout(tryFocus, 100);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [focusNoteId, loading, resumeReady, scrollToPage]);

  useEffect(() => {
    return () => {
      if (infoToastTimerRef.current) {
        clearTimeout(infoToastTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (loading || maxPage <= 0) return;
    const viewer = viewerRef.current;
    if (!viewer) return;

    let lastActivityBump = 0;

    function onScroll() {
      scheduleScrollSync();
      scheduleProgressSaveFromScroll();
      const now = performance.now();
      if (now - lastActivityBump > 220) {
        lastActivityBump = now;
        bumpStatusActivity();
      }
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
  }, [loading, maxPage, scheduleScrollSync, scheduleProgressSaveFromScroll, syncPageFromScroll, bumpStatusActivity]);

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
          if (isDrawingRef.current || isErasingRef.current) return;
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
    eraserStrokeWidthRef.current = width;
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
        const point = canvasPointFromClient(
          eraserOverlay.x,
          eraserOverlay.y,
          pageCanvas,
        );
        for (const [pageNumber, canvas] of drawLayerRefs.current.entries()) {
          if (canvas === pageCanvas) {
            scheduleDrawLayerPaint(pageNumber, eraserPreviewAt(point));
            break;
          }
        }
      }
    }
  }

  function startEditingNote(id: string) {
    const note = notes.find((entry) => entry.id === id);
    if (note) {
      setNoteTextColor(normalizeStickyColor(note.text_color));
      setNoteFontSize(note.position?.fontSize ?? DEFAULT_NOTE_FONT_SIZE);
      editingDraftRef.current = {
        title: noteTitle(note),
        body: note.note_text,
      };
      noteHadContentRef.current = noteHasContent(note);
    }
    setEditingNoteId(id);
  }

  function syncNoteDraft(id: string, draft: StickyNoteDraft) {
    if (editingNoteId === id) {
      editingDraftRef.current = draft;
      if (draft.title.trim().length > 0 || draft.body.trim().length > 0) {
        noteHadContentRef.current = true;
      }
    }
  }

  function pickNoteColor(color: string) {
    const next = normalizeStickyColor(color);
    setNoteTextColor(next);
    if (editingNoteId) {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === editingNoteId ? { ...n, text_color: next } : n,
        ),
      );
      void updateNoteColor(editingNoteId, next);
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

  function enqueueHistoryOp(op: () => Promise<void>) {
    historyChainRef.current = historyChainRef.current
      .then(op)
      .catch(() => undefined);
    return historyChainRef.current;
  }

  async function persistHistoryAction(action: HistoryAction, direction: "undo" | "redo") {
    if (action.type === "add_highlight") {
      if (direction === "undo") await deleteHighlightApi(action.highlight.id);
      else await upsertHighlight(action.highlight);
      return;
    }
    if (action.type === "delete_highlight") {
      if (direction === "undo") await upsertHighlight(action.highlight);
      else await deleteHighlightApi(action.highlight.id);
      return;
    }
    if (action.type === "update_highlight") {
      const target = direction === "undo" ? action.before : action.after;
      if (target.position) await updateHighlight(target.id, target.position);
      return;
    }
    if (action.type === "batch_highlight") {
      if (direction === "undo") {
        await Promise.all(
          action.changes.map((change) =>
            change.after === null
              ? upsertHighlight(change.before)
              : updateHighlight(change.before.id, change.before.position!),
          ),
        );
      } else {
        await Promise.all(
          action.changes.map((change) =>
            change.after === null
              ? deleteHighlightApi(change.before.id)
              : updateHighlight(change.after.id, change.after.position!),
          ),
        );
      }
      return;
    }
    if (action.type === "add_note") {
      if (direction === "undo") await deleteNoteApi(action.note.id);
      else await upsertNote(action.note);
      return;
    }
    if (action.type === "delete_note") {
      if (direction === "undo") await upsertNote(action.note);
      else await deleteNoteApi(action.note.id);
    }
  }

  function performUndo() {
    return enqueueHistoryOp(async () => {
      const action = undoStackRef.current.pop();
      if (!action) return;

      applyingHistoryRef.current = true;
      try {
        const applied = applyHistoryUndo(
          highlightsRef.current,
          notesRef.current,
          action,
        );
        const highlightPages = [
          ...new Set(
            [
              action.type === "add_highlight" || action.type === "delete_highlight"
                ? action.highlight.page_number
                : null,
              action.type === "update_highlight" ? action.before.page_number : null,
              ...(action.type === "batch_highlight"
                ? action.changes.map((change) => change.before.page_number)
                : []),
            ].filter((page): page is number => typeof page === "number"),
          ),
        ];
        if (
          action.type === "add_highlight" ||
          action.type === "delete_highlight" ||
          action.type === "update_highlight" ||
          action.type === "batch_highlight"
        ) {
          commitHighlights(applied.highlights, highlightPages);
        }
        if (action.type === "add_note" || action.type === "delete_note") {
          notesRef.current = applied.notes;
          setNotes(applied.notes);
        }
        scheduleAnnotationSync();
        redoStackRef.current.push(action);
        await persistHistoryAction(action, "undo");
      } catch (err) {
        undoStackRef.current.push(action);
        redoStackRef.current = redoStackRef.current.filter((entry) => entry !== action);
        setMessage(err instanceof Error ? err.message : "Could not undo");
      } finally {
        applyingHistoryRef.current = false;
      }
    });
  }

  function performRedo() {
    return enqueueHistoryOp(async () => {
      const action = redoStackRef.current.pop();
      if (!action) return;

      applyingHistoryRef.current = true;
      try {
        const applied = applyHistoryRedo(
          highlightsRef.current,
          notesRef.current,
          action,
        );
        const highlightPages = [
          ...new Set(
            [
              action.type === "add_highlight" || action.type === "delete_highlight"
                ? action.highlight.page_number
                : null,
              action.type === "update_highlight" ? action.after.page_number : null,
              ...(action.type === "batch_highlight"
                ? action.changes.map((change) => change.before.page_number)
                : []),
            ].filter((page): page is number => typeof page === "number"),
          ),
        ];
        if (
          action.type === "add_highlight" ||
          action.type === "delete_highlight" ||
          action.type === "update_highlight" ||
          action.type === "batch_highlight"
        ) {
          commitHighlights(applied.highlights, highlightPages);
        }
        if (action.type === "add_note" || action.type === "delete_note") {
          notesRef.current = applied.notes;
          setNotes(applied.notes);
        }
        scheduleAnnotationSync();
        undoStackRef.current.push(action);
        await persistHistoryAction(action, "redo");
      } catch (err) {
        redoStackRef.current.push(action);
        undoStackRef.current = undoStackRef.current.filter((entry) => entry !== action);
        setMessage(err instanceof Error ? err.message : "Could not redo");
      } finally {
        applyingHistoryRef.current = false;
      }
    });
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

        // Chrome-style zoom shortcuts: Ctrl/Cmd + / - / 0
        if (event.code === "Equal" || event.code === "NumpadAdd") {
          event.preventDefault();
          event.stopPropagation();
          zoomIn();
          return;
        }
        if (event.code === "Minus" || event.code === "NumpadSubtract") {
          event.preventDefault();
          event.stopPropagation();
          zoomOut();
          return;
        }
        if (event.code === "Digit0" || event.code === "Numpad0") {
          event.preventDefault();
          event.stopPropagation();
          setZoomPercent(Math.round(DEFAULT_ZOOM * 100));
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
      drawBackupFrozenRef.current = false;
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
      syncDrawBackup(pageNumber, eraserSessionRef.current.baseline, true);
      previewEraser(pageNumber, point, e.clientX, e.clientY);
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }

    if (!isDrawingTool(tool)) return;
    isDrawingRef.current = true;
    drawBackupFrozenRef.current = true;
    currentDrawPageRef.current = pageNumber;
    syncDrawBackup(pageNumber, highlightsRef.current, true);
    const point = getCanvasPoint(e);

    if (tool === "shape") {
      const hit = findShapeAtPoint(
        highlightsRef.current,
        pageNumber,
        point,
        e.currentTarget,
      );
      if (hit?.position?.shape) {
        const refW = hit.position.viewportWidth ?? e.currentTarget.width;
        const refH = hit.position.viewportHeight ?? e.currentTarget.height;
        const originShape =
          refW === e.currentTarget.width && refH === e.currentTarget.height
            ? { ...hit.position.shape }
            : scaleShape(
                hit.position.shape,
                refW,
                refH,
                e.currentTarget.width,
                e.currentTarget.height,
              );
        shapeDragRef.current = {
          pageNumber,
          highlightId: hit.id,
          startPoint: point,
          originShape,
          before: hit,
          moved: false,
        };
        isDrawingRef.current = true;
        drawBackupFrozenRef.current = true;
        currentDrawPageRef.current = pageNumber;
        syncDrawBackup(pageNumber, highlightsRef.current, true);
        e.currentTarget.setPointerCapture(e.pointerId);
        return;
      }

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
      shapeDragRef.current = null;
      drawDraftRef.current = {
        pageNumber,
        draft: {
          shape: currentShapeRef.current,
          shapeKind,
          color: penColor,
          type: "shape",
        },
      };
      e.currentTarget.setPointerCapture(e.pointerId);
      scheduleDrawLayerPaint(pageNumber);
      return;
    }

    const width = effectiveStrokeWidth(
      tool === "pen" ? penStrokeWidth : highlightStrokeWidth,
    );
    const stroke = { points: [point], width };
    currentStrokeRef.current = stroke;
    currentShapeRef.current = null;
    drawDraftRef.current = {
      pageNumber,
      draft: {
        stroke,
        color: tool === "pen" ? penColor : highlightColor,
        type: tool === "pen" ? "pen" : "freeform",
      },
    };
    e.currentTarget.setPointerCapture(e.pointerId);
    scheduleDrawLayerPaint(pageNumber);
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
    const pageNumber = currentDrawPageRef.current;
    if (pageNumber == null) return;

    const point = getCanvasPoint(e);

    if (tool === "shape") {
      const drag = shapeDragRef.current;
      if (drag && drag.pageNumber === pageNumber) {
        const dx = point.x - drag.startPoint.x;
        const dy = point.y - drag.startPoint.y;
        if (Math.hypot(dx, dy) >= 2) drag.moved = true;
        const movedShape = translateShape(drag.originShape, dx, dy);
        const next = highlightsRef.current.map((entry) => {
          if (entry.id !== drag.highlightId || !entry.position) return entry;
          return {
            ...entry,
            position: {
              ...entry.position,
              shape: movedShape,
              viewportWidth: e.currentTarget.width,
              viewportHeight: e.currentTarget.height,
            },
          };
        });
        highlightsRef.current = next;
        paintDrawLayer(pageNumber, next);
        return;
      }

      const shape = currentShapeRef.current;
      if (!shape) return;
      shape.x2 = point.x;
      shape.y2 = point.y;
      const draft = {
        shape,
        shapeKind,
        color: penColor,
        type: "shape" as const,
      };
      drawDraftRef.current = { pageNumber, draft };
      scheduleDrawLayerPaint(pageNumber);
      return;
    }

    const stroke = currentStrokeRef.current;
    if (!stroke) return;

    const last = stroke.points[stroke.points.length - 1];
    if (Math.hypot(point.x - last.x, point.y - last.y) < 1.5) return;
    stroke.points.push(point);

    const draft = {
      stroke,
      color: tool === "pen" ? penColor : highlightColor,
      type: (tool === "pen" ? "pen" : "freeform") as "pen" | "freeform",
    };
    drawDraftRef.current = { pageNumber, draft };
    scheduleDrawLayerPaint(pageNumber);
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
      drawBackupFrozenRef.current = false;
      if (drawFrameRef.current != null) {
        cancelAnimationFrame(drawFrameRef.current);
        drawFrameRef.current = null;
      }
      const path = [...currentEraserPathRef.current];
      currentEraserPathRef.current = [];
      currentDrawPageRef.current = null;
      applyEraserStroke(pageNumber, path);
      return;
    }

    if (!isDrawingRef.current || !isDrawingTool(tool)) return;
    const drawPage = currentDrawPageRef.current;
    isDrawingRef.current = false;
    drawBackupFrozenRef.current = false;
    currentDrawPageRef.current = null;
    pendingDrawPageRef.current = null;
    pendingEraserPreviewRef.current = undefined;
    if (drawFrameRef.current != null) {
      cancelAnimationFrame(drawFrameRef.current);
      drawFrameRef.current = null;
    }

    if (tool === "shape") {
      const drag = shapeDragRef.current;
      const shape = currentShapeRef.current;
      shapeDragRef.current = null;
      currentShapeRef.current = null;
      clearDrawDraft(pageNumber);

      if (drag) {
        const after = highlightsRef.current.find((entry) => entry.id === drag.highlightId);
        if (drag.moved && after?.position?.shape) {
          commitHighlights(highlightsRef.current, [pageNumber]);
          pushHistory({ type: "update_highlight", before: drag.before, after });
          void updateHighlight(after.id, after.position)
            .then(() => scheduleAnnotationSync())
            .catch((err) => {
              setMessage(err instanceof Error ? err.message : "Could not move shape");
            });
        } else if (drawPage != null) {
          const restored = highlightsRef.current.map((entry) =>
            entry.id === drag.highlightId ? drag.before : entry,
          );
          highlightsRef.current = restored;
          syncDrawBackup(drawPage, restored, true);
          paintDrawLayer(drawPage, restored);
        }
        return;
      }

      if (
        shape &&
        (Math.abs(shape.x2 - shape.x1) >= 4 || Math.abs(shape.y2 - shape.y1) >= 4)
      ) {
        saveShape(pageNumber, shape, shapeKind);
      } else if (drawPage != null) {
        syncDrawBackup(drawPage, highlightsRef.current, true);
        paintDrawLayer(drawPage, highlightsRef.current);
      }
      return;
    }

    const stroke = currentStrokeRef.current;
    const highlightType = tool === "pen" ? "pen" : "freeform";
    currentStrokeRef.current = null;
    clearDrawDraft(pageNumber);

    if (stroke && stroke.points.length > 1) {
      saveStroke(pageNumber, stroke, highlightType);
    } else if (drawPage != null) {
      syncDrawBackup(drawPage, highlightsRef.current, true);
      paintDrawLayer(drawPage, highlightsRef.current);
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

    if ((tool !== "note" && tool !== "comment") || editingNoteId) return;

    const point = canvasPointFromClient(e.clientX, e.clientY, canvas);
    const isComment = tool === "comment";
    const position: NotePosition = {
      x: Math.max(8, point.x - 20),
      y: Math.max(8, point.y - 20),
      width: isComment ? DEFAULT_COMMENT_WIDTH : DEFAULT_STICKY_WIDTH,
      height: isComment ? DEFAULT_COMMENT_HEIGHT : DEFAULT_STICKY_HEIGHT,
      fontSize: noteFontSize,
      title: "",
      rotation: 0,
      kind: isComment ? "comment" : "sticky",
      viewportWidth: canvas.width,
      viewportHeight: canvas.height,
    };

    try {
      const data = await insertNote({
        bookId,
        userId,
        pageNumber,
        position,
        textColor: isComment ? "yellow" : normalizeStickyColor(noteTextColor),
      });
      setNotes((prev) => [...prev, data]);
      pushHistory({ type: "add_note", note: data });
      editingDraftRef.current = { title: "", body: "" };
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

    if ((tool === "note" || tool === "comment") && !editingNoteId) {
      void handlePageClick(e, pageNumber);
      return;
    }

    if (tool === "eraser") {
      void handlePageClick(e, pageNumber);
    }
  }

  async function finishNote(id: string, draft: StickyNoteDraft) {
    const title = draft.title.trim();
    const body = draft.body.trim();
    const hasText = title.length > 0 || body.length > 0;
    const existing = notes.find((entry) => entry.id === id);
    const nextPosition: NotePosition = {
      ...(existing?.position ?? {
        x: 0,
        y: 0,
        width: DEFAULT_STICKY_WIDTH,
        height: DEFAULT_STICKY_HEIGHT,
        kind: "sticky",
      }),
      title,
      kind: existing?.position?.kind ?? "sticky",
    };

    if (!hasText) {
      setEditingNoteId(null);
      setTool("read");
      if (!noteHadContentRef.current) {
        await deleteNote(id);
        return;
      }

      setNotes((prev) =>
        prev.map((n) =>
          n.id === id
            ? {
                ...n,
                note_text: "",
                position: n.position ? { ...n.position, title: "" } : n.position,
              }
            : n,
        ),
      );
      editingDraftRef.current = { title: "", body: "" };
      try {
        await clearNoteText(id);
        if (existing?.position) {
          await updateNoteFontSizeApi(id, { ...existing.position, title: "" });
        }
      } catch (err) {
        setMessage(err instanceof Error ? err.message : "Could not clear note");
      }
      return;
    }

    setNotes((prev) =>
      prev.map((n) =>
        n.id === id
          ? {
              ...n,
              note_text: body,
              position: n.position ? { ...n.position, title } : nextPosition,
            }
          : n,
      ),
    );
    editingDraftRef.current = { title, body };
    noteHadContentRef.current = true;
    setEditingNoteId(null);
    setTool("read");

    try {
      await updateNoteText(id, body);
      await updateNoteFontSizeApi(id, nextPosition);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not save note");
    }
  }

  finishNoteRef.current = finishNote;

  async function rotateNote(id: string, rotation: number) {
    const existing = notes.find((entry) => entry.id === id);
    if (!existing?.position) return;
    const position = { ...existing.position, rotation };
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, position } : n)),
    );
    try {
      await updateNoteFontSizeApi(id, position);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not rotate note");
    }
  }

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

  function showInfoToast(text: string) {
    if (infoToastTimerRef.current) {
      clearTimeout(infoToastTimerRef.current);
    }
    setInfoToast(text);
    infoToastTimerRef.current = setTimeout(() => {
      setInfoToast(null);
      infoToastTimerRef.current = null;
    }, 6500);
  }

  async function moveNote(id: string, position: NotePosition) {
    const previous = notes.find((entry) => entry.id === id)?.position ?? null;
    const wasOnPage = previous ? isNoteOnPage(previous) : true;
    const nowOnPage = isNoteOnPage(position);

    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, position } : n)),
    );

    if (wasOnPage && !nowOnPage) {
      showInfoToast(OFF_PAGE_NOTE_EXPORT_NOTICE);
    }

    try {
      await moveNoteApi(id, position);
    } catch (err) {
      if (previous) {
        setNotes((prev) =>
          prev.map((n) => (n.id === id ? { ...n, position: previous } : n)),
        );
      }
      setMessage(err instanceof Error ? err.message : "Could not move note.");
    }
  }

  async function deleteNote(id: string) {
    const note = notes.find((entry) => entry.id === id);
    if (note) {
      pushHistory({ type: "delete_note", note });
    }
    await deleteNoteApi(id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (editingNoteId === id) setEditingNoteId(null);
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

  function stopPanMomentum() {
    if (panMomentumFrameRef.current != null) {
      cancelAnimationFrame(panMomentumFrameRef.current);
      panMomentumFrameRef.current = null;
    }
  }

  function stopPanMoveFrame() {
    if (panMoveFrameRef.current != null) {
      cancelAnimationFrame(panMoveFrameRef.current);
      panMoveFrameRef.current = null;
    }
    panPendingPointRef.current = null;
  }

  function applyPanPoint(clientX: number, clientY: number) {
    const pan = panRef.current;
    const viewer = viewerRef.current;
    if (!pan || !viewer) return;

    const now = performance.now();
    const dt = Math.max(1, now - pan.lastTime);
    const moveX = clientX - pan.lastX;
    const moveY = clientY - pan.lastY;
    const instantVx = -moveX / dt;
    const instantVy = -moveY / dt;
    pan.vx = pan.vx * 0.55 + instantVx * 0.45;
    pan.vy = pan.vy * 0.55 + instantVy * 0.45;
    pan.lastX = clientX;
    pan.lastY = clientY;
    pan.lastTime = now;

    viewer.scrollLeft = pan.scrollLeft - (clientX - pan.startX);
    viewer.scrollTop = pan.scrollTop - (clientY - pan.startY);
  }

  function startPanMomentum(viewer: HTMLDivElement, vx: number, vy: number) {
    stopPanMomentum();
    if (Math.hypot(vx, vy) < 0.04) {
      scheduleScrollSync();
      scheduleProgressSaveFromScroll();
      return;
    }

    let velocityX = vx;
    let velocityY = vy;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(34, now - lastTime);
      lastTime = now;

      viewer.scrollLeft += velocityX * dt;
      viewer.scrollTop += velocityY * dt;

      // Longer, softer glide
      const decay = Math.exp((-2.6 * dt) / 1000);
      velocityX *= decay;
      velocityY *= decay;

      if (Math.hypot(velocityX, velocityY) < 0.015) {
        panMomentumFrameRef.current = null;
        scheduleScrollSync();
        scheduleProgressSaveFromScroll();
        return;
      }

      panMomentumFrameRef.current = requestAnimationFrame(tick);
    };

    panMomentumFrameRef.current = requestAnimationFrame(tick);
  }

  function handleViewerPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (tool !== "pan" || editingNoteId) return;
    const viewer = viewerRef.current;
    if (!viewer) return;
    stopPanMomentum();
    stopPanMoveFrame();
    const now = performance.now();
    panRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      scrollLeft: viewer.scrollLeft,
      scrollTop: viewer.scrollTop,
      lastX: e.clientX,
      lastY: e.clientY,
      lastTime: now,
      vx: 0,
      vy: 0,
    };
    viewer.setPointerCapture(e.pointerId);
  }

  function handleViewerPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (tool === "eraser" && !editingNoteId) {
      syncEraserOverlay(e.clientX, e.clientY);
    }

    const pan = panRef.current;
    if (!pan || pan.pointerId !== e.pointerId) return;

    panPendingPointRef.current = { clientX: e.clientX, clientY: e.clientY };
    if (panMoveFrameRef.current != null) return;
    panMoveFrameRef.current = requestAnimationFrame(() => {
      panMoveFrameRef.current = null;
      const point = panPendingPointRef.current;
      panPendingPointRef.current = null;
      if (!point) return;
      applyPanPoint(point.clientX, point.clientY);
    });
  }

  function handleViewerPointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    const pan = panRef.current;
    const viewer = viewerRef.current;
    if (!pan || pan.pointerId !== e.pointerId) return;

    // Flush any pending move so velocity matches the last finger position.
    if (panPendingPointRef.current) {
      applyPanPoint(panPendingPointRef.current.clientX, panPendingPointRef.current.clientY);
    }
    stopPanMoveFrame();

    const { vx, vy } = pan;
    panRef.current = null;
    if (viewer?.hasPointerCapture(e.pointerId)) {
      viewer.releasePointerCapture(e.pointerId);
    }
    if (viewer) {
      startPanMomentum(viewer, vx, vy);
    } else {
      scheduleScrollSync();
      scheduleProgressSaveFromScroll();
    }
  }

  return (
    <div
      className={cn(
        "reader-shell acrobat-reader fixed inset-0 z-40 flex flex-col outline-none",
        darkMode && "reader-theme-dark",
      )}
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
        pageBookmarked={bookmarks.some((bookmark) => bookmark.page_number === page)}
        bookmarkPulse={bookmarkPulse}
        darkMode={darkMode}
        focusMode={focusMode}
        onBookmark={() => selectTool("bookmark", { force: true })}
        onSave={() => void handleSave()}
        onToggleDarkMode={() => {
          setDarkMode((current) => {
            const next = !current;
            saveReaderDarkMode(next);
            void syncReaderDarkModePreference(next);
            return next;
          });
        }}
        onToggleFocusMode={() => {
          setFocusMode((current) => {
            const next = !current;
            saveReaderFocusMode(next);
            return next;
          });
        }}
      />

      {(offline || message) && (
        <div className="shrink-0 space-y-1 border-b border-[var(--reader-chrome-border)] px-3 py-1.5 text-xs">
          {offline && (
            <p className="text-[var(--reader-text-muted)]">
              Offline. Changes sync when you are back online.
            </p>
          )}
          {message && <p className={darkMode ? "text-amber-300" : "text-amber-700"}>{message}</p>}
        </div>
      )}

      {infoToast && (
        <div
          role="status"
          className="pointer-events-none absolute bottom-20 left-1/2 z-50 w-[min(28rem,calc(100%-2rem))] -translate-x-1/2 rounded-xl border border-[#eadbc8] bg-[#fffdf9] px-4 py-3 text-center text-sm leading-snug text-[#3c2a21] shadow-[0_12px_32px_rgba(31,22,16,0.18)]"
        >
          {infoToast}
        </div>
      )}

      <div className="relative min-h-0 flex-1">
        {focusMode && <div className="reader-focus-overlay" aria-hidden />}
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
          editingNote={Boolean(
            editingNoteId &&
              notes.some((n) => n.id === editingNoteId && isStickyNote(n)),
          )}
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
              resumeActionRef.current = "continue";
              setShowResumeOverlay(false);
              setResumeReady(true);
            }}
            onStartOver={() => {
              resumeActionRef.current = "start-over";
              setShowResumeOverlay(false);
              setResumeReady(true);
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
            "reader-viewport-shell h-full overflow-auto outline-none",
            tool === "pan" && "cursor-grab active:cursor-grabbing",
            tool === "eraser" && !editingNoteId && "cursor-none",
          )}
          onPointerDown={(e) => {
            handleViewerPointerDown(e);
            if (tool !== "pan" || editingNoteId) {
              e.currentTarget.focus({ preventScroll: true });
            }
          }}
          onPointerMove={(e) => {
            bumpStatusActivity();
            handleViewerPointerMove(e);
          }}
          onPointerUp={handleViewerPointerUp}
          onPointerCancel={handleViewerPointerUp}
          onPointerLeave={(e) => {
            if (tool === "eraser" && e.currentTarget === viewerRef.current) {
              setEraserOverlay(null);
            }
          }}
        >
          {loading && (
            <LoadingState className="h-full min-h-[50vh] py-0" />
          )}
          {error && (
            <p className="flex h-full items-center justify-center px-6 text-center text-sm text-red-300">
              {error}
            </p>
          )}
          <div ref={zoomSpacerRef} className="reader-zoom-spacer">
          <div
            ref={zoomLayerRef}
            className="reader-pages-column reader-zoom-layer mx-auto flex w-max min-w-full max-w-none flex-col items-center gap-2.5 py-4"
            style={{ visibility: loading || error ? "hidden" : "visible" }}
          >
            {Array.from({ length: maxPage }, (_, index) => {
              const pageNumber = index + 1;
              const slotWidth = pageSlotSize?.width ?? 420;
              const slotHeight = pageSlotSize?.height ?? 594;
              const pageBookmarks = bookmarks.filter(
                (bookmark) => bookmark.page_number === pageNumber,
              );
              const pageNotes = notes.filter(
                (note) => note.page_number === pageNumber,
              );
              const canvasEl = canvasRefs.current.get(pageNumber);
              const pageDisplayW = canvasEl
                ? Number.parseFloat(canvasEl.style.width) || slotWidth
                : slotWidth;
              const pageDisplayH = canvasEl
                ? Number.parseFloat(canvasEl.style.height) || slotHeight
                : slotHeight;
              const noteExtent = noteOverflowExtent(
                pageNotes,
                pageDisplayW,
                pageDisplayH,
              );

              return (
                <div
                  key={pageNumber}
                  data-page={pageNumber}
                  ref={bindMapRef(pageWrapRefs, pageNumber)}
                  className={cn(
                    "reader-page-surface relative w-fit",
                    focusMode && pageNumber === page && "reader-focus-page z-[1]",
                    (tool === "note" || tool === "comment") &&
                      !editingNoteId &&
                      "cursor-crosshair",
                    tool === "eraser" && !editingNoteId && "cursor-none",
                  )}
                  onPointerDown={(e) => handleContainerPointerDown(e, pageNumber)}
                >
                  {noteExtent && (
                    <div
                      aria-hidden
                      className="pointer-events-none absolute"
                      style={noteExtent}
                    />
                  )}
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
                        className="reader-page-panel acrobat-page-panel block"
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
                      {pageNotes.map((note) =>
                          isCommentNote(note) ? (
                            <PageComment
                              key={note.id}
                              note={note}
                              editing={editingNoteId === note.id}
                              onFinish={(id, text) =>
                                finishNote(id, { title: "", body: text })
                              }
                              onDelete={deleteNote}
                              onMove={moveNote}
                              onStartEdit={startEditingNote}
                              onDraftChange={(id, text) =>
                                syncNoteDraft(id, { title: "", body: text })
                              }
                              canvasRef={canvasRefForPage(canvasRefs, pageNumber)}
                              pageViewport={pageViewport}
                            />
                          ) : (
                            <PageNote
                              key={note.id}
                              note={note}
                              editing={editingNoteId === note.id}
                              liveFontSize={
                                editingNoteId === note.id ? noteFontSize : undefined
                              }
                              livePaperColor={
                                editingNoteId === note.id ? noteTextColor : undefined
                              }
                              onFinish={finishNote}
                              onDelete={deleteNote}
                              onMove={moveNote}
                              onStartEdit={startEditingNote}
                              onDraftChange={syncNoteDraft}
                              onRotate={rotateNote}
                              canvasRef={canvasRefForPage(canvasRefs, pageNumber)}
                              canvasDisplayWidth={
                                pageNumber === page ? canvasDisplayWidth : slotWidth
                              }
                              pageViewport={pageViewport}
                            />
                          ),
                        )}
                    </>
                  ) : (
                    <div
                      className="reader-page-panel acrobat-page-panel"
                      style={{ width: slotWidth, height: slotHeight }}
                    />
                  )}
                </div>
              );
            })}
          </div>
          </div>
        </div>

        <ReaderStatusBar
          page={page}
          maxPage={maxPage}
          zoomPercent={zoomPercentUi}
          onGoToPage={scrollToPage}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onZoomPercentChange={setZoomPercent}
          activitySignal={statusActivity}
        />
      </div>
    </div>
  );
}
