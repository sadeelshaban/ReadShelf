"use client";

import Link from "next/link";
import { FocusIcon, HomeIcon, MoonIcon, SunIcon } from "@/components/reader/ReaderIcons";
import { ReaderTooltip } from "@/components/reader/ReaderTooltip";

type ReaderTopBarProps = {
  bookId: string;
  title: string;
  page: number;
  maxPage: number;
  progressPercent: number;
  darkMode: boolean;
  focusMode: boolean;
  onToggleDarkMode: () => void;
  onToggleFocusMode: () => void;
};

export function ReaderTopBar({
  bookId,
  title,
  page,
  maxPage,
  progressPercent,
  darkMode,
  focusMode,
  onToggleDarkMode,
  onToggleFocusMode,
}: ReaderTopBarProps) {
  return (
    <header id="reader-top-bar" className="reader-topbar shrink-0 border-b border-[var(--reader-chrome-border)]">
      <div className="grid h-11 grid-cols-[auto_1fr_auto] items-center gap-2 px-3 sm:gap-3">
        <div className="flex items-center justify-start">
          <ReaderTooltip label="Home">
            <Link
              href="/shelf"
              aria-label="Home"
              className="reader-topbar-btn reader-topbar-btn-lg"
            >
              <HomeIcon />
            </Link>
          </ReaderTooltip>
        </div>

        <div className="flex min-w-0 flex-col items-center justify-center px-2">
          <Link
            href={`/book/${bookId}`}
            className="max-w-full truncate text-center text-sm text-[var(--reader-text)] transition-colors hover:opacity-80"
            title={title}
          >
            {title}
          </Link>
        </div>

        <div className="flex items-center justify-end gap-1">
          <ReaderTooltip label={focusMode ? "Exit focus mode" : "Focus mode"}>
            <button
              type="button"
              aria-label={focusMode ? "Exit focus mode" : "Focus mode"}
              aria-pressed={focusMode}
              data-active={focusMode}
              onClick={onToggleFocusMode}
              className="reader-topbar-btn reader-topbar-btn-lg"
            >
              <FocusIcon />
            </button>
          </ReaderTooltip>
          <ReaderTooltip label={darkMode ? "Light mode" : "Dark mode"}>
            <button
              type="button"
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              aria-pressed={darkMode}
              onClick={onToggleDarkMode}
              className="reader-topbar-btn reader-topbar-btn-lg"
            >
              {darkMode ? <SunIcon /> : <MoonIcon />}
            </button>
          </ReaderTooltip>
        </div>
      </div>

      <div className="reader-progress-row">
        <div className="reader-progress-meta">
          <span>Reading progress</span>
          <span>
            {progressPercent}% · Page {page} of {maxPage}
          </span>
        </div>
        <div
          className="reader-progress-track"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progressPercent}
          aria-label={`Reading progress ${progressPercent} percent`}
        >
          <div className="reader-progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>
    </header>
  );
}
