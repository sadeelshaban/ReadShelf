"use client";

import Link from "next/link";
import { BookmarkFilledIcon, HomeIcon } from "@/components/reader/ReaderIcons";
import { READER_TOOL_ICONS, ReaderToolIcon } from "@/components/reader/ReaderToolIcon";
import { cn } from "@/lib/utils";

type ReaderTopBarProps = {
  bookId: string;
  title: string;
  saving?: boolean;
  saveLabel?: string | null;
  pageBookmarked?: boolean;
  bookmarkPulse?: boolean;
  onSave: () => void;
  onBookmark: () => void;
};

export function ReaderTopBar({
  bookId,
  title,
  saving,
  saveLabel,
  pageBookmarked,
  bookmarkPulse,
  onSave,
  onBookmark,
}: ReaderTopBarProps) {
  return (
    <header id="reader-top-bar" className="acrobat-topbar shrink-0">
      <div className="grid h-11 grid-cols-[auto_1fr_auto] items-center gap-2 border-b border-white/10 px-3 sm:gap-3">
        <div className="flex items-center justify-start">
          <Link
            href="/shelf"
            title="Home"
            aria-label="Home"
            className="acrobat-topbar-btn acrobat-topbar-btn-lg"
          >
            <HomeIcon />
          </Link>
        </div>

        <div className="flex min-w-0 justify-center px-2">
          <Link
            href={`/book/${bookId}`}
            className="max-w-full truncate text-center text-sm text-white/90 transition-colors hover:text-white"
            title={title}
          >
            {title}
          </Link>
        </div>

        <div className="flex items-center justify-end gap-1.5 pr-0.5">
          <button
            type="button"
            title={pageBookmarked ? "This page is bookmarked" : "Add bookmark"}
            aria-label={pageBookmarked ? "This page is bookmarked" : "Add bookmark"}
            aria-pressed={pageBookmarked}
            data-active={pageBookmarked}
            onClick={onBookmark}
            className={cn(
              "acrobat-topbar-btn acrobat-topbar-btn-xl",
              pageBookmarked && "text-[#f5d78e]",
              bookmarkPulse && "acrobat-topbar-btn-bookmark-pulse",
            )}
          >
            {pageBookmarked ? (
              <BookmarkFilledIcon />
            ) : (
              <ReaderToolIcon src={READER_TOOL_ICONS.bookmark} alt="Bookmark" />
            )}
          </button>
          <button
            type="button"
            title="Save progress"
            aria-label="Save progress"
            disabled={saving}
            onClick={onSave}
            className={cn("acrobat-topbar-btn acrobat-topbar-btn-xl", saving && "opacity-50")}
          >
            <ReaderToolIcon src={READER_TOOL_ICONS.save} alt="Save progress" />
          </button>
          {saveLabel && (
            <span className="hidden text-xs text-emerald-400 sm:inline">{saveLabel}</span>
          )}
        </div>
      </div>
    </header>
  );
}
