"use client";

import Link from "next/link";
import { HomeIcon, SaveIcon } from "@/components/reader/ReaderIcons";
import { cn } from "@/lib/utils";

type ReaderTopBarProps = {
  bookId: string;
  title: string;
  saving?: boolean;
  saveLabel?: string | null;
  onSave: () => void;
};

export function ReaderTopBar({
  bookId,
  title,
  saving,
  saveLabel,
  onSave,
}: ReaderTopBarProps) {
  return (
    <header id="reader-top-bar" className="acrobat-topbar shrink-0">
      <div className="flex h-11 items-center gap-2 border-b border-white/10 px-3">
        <Link href="/shelf" title="Home" aria-label="Home" className="acrobat-topbar-btn">
          <HomeIcon />
        </Link>
        <Link
          href={`/book/${bookId}`}
          className="max-w-[min(52vw,360px)] truncate px-1 text-sm text-white/90 hover:text-white"
          title={title}
        >
          {title}
        </Link>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            title="Sync latest annotations and reading progress"
            aria-label="Save latest changes"
            disabled={saving}
            onClick={onSave}
            className={cn("acrobat-topbar-btn", saving && "opacity-50")}
          >
            <SaveIcon />
          </button>
          {saveLabel && (
            <span className="hidden text-xs text-emerald-400 sm:inline">{saveLabel}</span>
          )}
        </div>
      </div>
    </header>
  );
}
