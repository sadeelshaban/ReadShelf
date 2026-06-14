"use client";

import Link from "next/link";
import { HomeIcon, MenuIcon, SaveIcon } from "@/components/reader/ReaderIcons";
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
        <button
          type="button"
          title="Menu"
          aria-label="Menu"
          className="acrobat-topbar-btn"
        >
          <MenuIcon />
        </button>
        <Link href="/shelf" title="Home" aria-label="Home" className="acrobat-topbar-btn">
          <HomeIcon />
        </Link>
        <Link
          href={`/book/${bookId}`}
          className="max-w-[min(42vw,320px)] truncate px-1 text-sm text-white/90 hover:text-white"
          title={title}
        >
          {title}
        </Link>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            title="Save progress and sync notes"
            aria-label="Save"
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
      <div className="flex h-9 items-center gap-1 border-b border-white/10 px-3 text-xs text-white/75">
        <span className="rounded bg-white/10 px-2.5 py-1 text-white">Read</span>
        <span className="rounded px-2.5 py-1 hover:bg-white/5">Annotate</span>
      </div>
    </header>
  );
}
