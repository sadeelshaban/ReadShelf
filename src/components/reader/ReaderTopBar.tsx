"use client";

import Link from "next/link";
import { BookmarkFilledIcon, FocusIcon, HomeIcon, MoonIcon, SunIcon } from "@/components/reader/ReaderIcons";
import { READER_TOOL_ICONS, ReaderToolIcon } from "@/components/reader/ReaderToolIcon";
import { ReaderTooltip } from "@/components/reader/ReaderTooltip";
import { cn } from "@/lib/utils";

type ReaderTopBarProps = {
  bookId: string;
  title: string;
  saving?: boolean;
  pageBookmarked?: boolean;
  bookmarkPulse?: boolean;
  darkMode: boolean;
  focusMode: boolean;
  onBookmark: () => void;
  onSave: () => void;
  onToggleDarkMode: () => void;
  onToggleFocusMode: () => void;
};

export function ReaderTopBar({
  bookId,
  title,
  saving,
  pageBookmarked,
  bookmarkPulse,
  darkMode,
  focusMode,
  onBookmark,
  onSave,
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

        <div className="flex min-w-0 justify-center px-2">
          <Link
            href={`/book/${bookId}`}
            className="max-w-full truncate text-center text-sm text-[var(--reader-text)] transition-colors hover:opacity-80"
            title={title}
          >
            {title}
          </Link>
        </div>

        <div className="flex items-center justify-end gap-1">
          <ReaderTooltip label={pageBookmarked ? "This page is bookmarked" : "Add bookmark"}>
            <button
              type="button"
              aria-label={pageBookmarked ? "This page is bookmarked" : "Add bookmark"}
              aria-pressed={pageBookmarked}
              data-active={pageBookmarked}
              onClick={onBookmark}
              className={cn(
                "reader-topbar-btn reader-topbar-btn-lg",
                pageBookmarked && "text-[#f5d78e]",
                bookmarkPulse && "reader-topbar-btn-bookmark-pulse",
              )}
            >
              {pageBookmarked ? (
                <BookmarkFilledIcon />
              ) : (
                <ReaderToolIcon src={READER_TOOL_ICONS.bookmark} alt="Bookmark" />
              )}
            </button>
          </ReaderTooltip>

          <ReaderTooltip label="Save progress">
            <button
              type="button"
              aria-label="Save progress"
              disabled={saving}
              onClick={onSave}
              className={cn("reader-topbar-btn reader-topbar-btn-lg", saving && "opacity-50")}
            >
              <ReaderToolIcon src={READER_TOOL_ICONS.save} alt="Save progress" />
            </button>
          </ReaderTooltip>

          <span className="reader-topbar-divider mx-0.5" aria-hidden />

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
    </header>
  );
}
