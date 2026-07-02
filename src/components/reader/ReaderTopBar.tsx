"use client";

import Link from "next/link";
import { HomeIcon } from "@/components/reader/ReaderIcons";
import { READER_TOOL_ICONS, ReaderToolIcon } from "@/components/reader/ReaderToolIcon";
import { cn } from "@/lib/utils";

type ReaderTopBarProps = {
  bookId: string;
  title: string;
  saving?: boolean;
  saveLabel?: string | null;
  bookmarkActive?: boolean;
  onSave: () => void;
  onBookmark: () => void;
};

export function ReaderTopBar({
  bookId,
  title,
  saving,
  saveLabel,
  bookmarkActive,
  onSave,
  onBookmark,
}: ReaderTopBarProps) {
  return (
    <header id="reader-top-bar" className="acrobat-topbar shrink-0">
      <div className="flex h-11 items-center gap-1 border-b border-white/10 px-3 sm:gap-2">
        <Link
          href="/shelf"
          title="Home"
          aria-label="Home"
          className="acrobat-topbar-btn acrobat-topbar-btn-lg"
        >
          <HomeIcon />
        </Link>
        <Link
          href={`/book/${bookId}`}
          className="ml-2 max-w-[min(52vw,360px)] truncate px-1 text-sm text-white/90 transition-colors hover:text-white sm:ml-3"
          title={title}
        >
          {title}
        </Link>
        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            title="Add bookmark"
            aria-label="Add bookmark"
            aria-pressed={bookmarkActive}
            data-active={bookmarkActive}
            onClick={onBookmark}
            className={cn("acrobat-topbar-btn acrobat-topbar-btn-lg", bookmarkActive && "bg-[#c9952a]/25")}
          >
            <ReaderToolIcon src={READER_TOOL_ICONS.bookmark} alt="Bookmark" />
          </button>
          <button
            type="button"
            title="Save progress"
            aria-label="Save latest changes"
            disabled={saving}
            onClick={onSave}
            className={cn("acrobat-topbar-btn acrobat-topbar-btn-lg", saving && "opacity-50")}
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
