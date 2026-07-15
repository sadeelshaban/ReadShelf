"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, ZoomInIcon, ZoomOutIcon } from "@/components/reader/ReaderIcons";
import { cn } from "@/lib/utils";

const HIDE_DELAY_MS = 2800;

type ReaderStatusBarProps = {
  page: number;
  maxPage: number;
  zoomPercent: number;
  onGoToPage: (page: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomPercentChange: (percent: number) => void;
  activitySignal: number;
};

function PageNumberField({
  page,
  maxPage,
  onGoToPage,
}: {
  page: number;
  maxPage: number;
  onGoToPage: (page: number) => void;
}) {
  const [draft, setDraft] = useState(String(page));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) {
      setDraft(String(page));
    }
  }, [page, focused]);

  function commit() {
    const trimmed = draft.trim();
    if (!trimmed) {
      setDraft(String(page));
      return;
    }

    const parsed = Number.parseInt(trimmed, 10);
    if (Number.isNaN(parsed)) {
      setDraft(String(page));
      return;
    }

    const clamped = Math.min(maxPage, Math.max(1, parsed));
    setDraft(String(clamped));
    onGoToPage(clamped);
  }

  return (
    <div className="reader-status-page flex items-center gap-1.5">
      <button
        type="button"
        aria-label="Previous page"
        title="Previous page"
        disabled={page <= 1}
        onClick={() => onGoToPage(page - 1)}
        className="reader-chrome-btn reader-chrome-btn-sm"
      >
        <ChevronLeftIcon className="h-4 w-4" />
      </button>

      <label className="reader-status-page-field flex cursor-text items-center gap-1 rounded-md px-2 py-1">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={draft}
          onChange={(e) => setDraft(e.target.value.replace(/\D/g, ""))}
          onFocus={(e) => {
            setFocused(true);
            e.target.select();
          }}
          onBlur={() => {
            setFocused(false);
            commit();
          }}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
              e.currentTarget.blur();
            }
            if (e.key === "Escape") {
              setDraft(String(page));
              e.currentTarget.blur();
            }
          }}
          aria-label="Current page"
          title="Click to jump to a page"
          className="reader-status-page-input w-7 bg-transparent text-center font-semibold tabular-nums outline-none"
        />
        <span className="reader-status-page-total select-none font-medium tabular-nums">/ {maxPage}</span>
      </label>

      <button
        type="button"
        aria-label="Next page"
        title="Next page"
        disabled={page >= maxPage}
        onClick={() => onGoToPage(page + 1)}
        className="reader-chrome-btn reader-chrome-btn-sm"
      >
        <ChevronRightIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

function ZoomPercentField({
  zoomPercent,
  onZoomPercentChange,
}: {
  zoomPercent: number;
  onZoomPercentChange: (percent: number) => void;
}) {
  const [draft, setDraft] = useState(String(zoomPercent));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) {
      setDraft(String(zoomPercent));
    }
  }, [zoomPercent, focused]);

  function commit() {
    const trimmed = draft.trim().replace(/%/g, "");
    if (!trimmed) {
      setDraft(String(zoomPercent));
      return;
    }

    const parsed = Number.parseFloat(trimmed);
    if (Number.isNaN(parsed)) {
      setDraft(String(zoomPercent));
      return;
    }

    const clamped = Math.min(400, Math.max(25, Math.round(parsed)));
    setDraft(String(clamped));
    onZoomPercentChange(clamped);
  }

  return (
    <label className="reader-status-page-field flex cursor-text items-center rounded-md px-1.5 py-0.5">
      <input
        type="text"
        inputMode="decimal"
        value={draft}
        onChange={(e) => setDraft(e.target.value.replace(/[^\d.]/g, ""))}
        onFocus={(e) => {
          setFocused(true);
          e.target.select();
        }}
        onBlur={() => {
          setFocused(false);
          commit();
        }}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
            e.currentTarget.blur();
          }
          if (e.key === "Escape") {
            setDraft(String(zoomPercent));
            e.currentTarget.blur();
          }
        }}
        aria-label="Zoom percent"
        title="Type a zoom percent (e.g. 34 or 83)"
        className="reader-status-page-input w-8 bg-transparent text-center font-semibold tabular-nums outline-none"
      />
      <span className="select-none text-[11px] font-semibold">%</span>
    </label>
  );
}

export function ReaderStatusBar({
  page,
  maxPage,
  zoomPercent,
  onGoToPage,
  onZoomIn,
  onZoomOut,
  onZoomPercentChange,
  activitySignal,
}: ReaderStatusBarProps) {
  const [visible, setVisible] = useState(true);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setVisible(true);
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }
    hideTimerRef.current = setTimeout(() => setVisible(false), HIDE_DELAY_MS);
    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, [activitySignal, page, zoomPercent]);

  return (
    <div
      id="reader-status-bar"
      className={cn(
        "reader-status-bar pointer-events-auto absolute inset-x-0 bottom-4 z-30 mx-auto flex w-fit max-w-[calc(100%-2rem)] items-center gap-3 rounded-full px-3 py-2 transition-all duration-300",
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0",
      )}
      onPointerEnter={() => setVisible(true)}
      onPointerLeave={() => {
        hideTimerRef.current = setTimeout(() => setVisible(false), HIDE_DELAY_MS);
      }}
    >
      <PageNumberField page={page} maxPage={maxPage} onGoToPage={onGoToPage} />

      <span className="reader-status-divider h-5 w-px shrink-0" aria-hidden />

      <div className="flex items-center gap-1.5">
        <ZoomPercentField
          zoomPercent={zoomPercent}
          onZoomPercentChange={onZoomPercentChange}
        />
        <button
          type="button"
          aria-label="Zoom out"
          title="Zoom out"
          onClick={onZoomOut}
          className="reader-chrome-btn reader-chrome-btn-sm"
        >
          <ZoomOutIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Zoom in"
          title="Zoom in"
          onClick={onZoomIn}
          className="reader-chrome-btn reader-chrome-btn-sm"
        >
          <ZoomInIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
