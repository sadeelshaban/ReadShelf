"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import type { SortOption } from "@/types";
import { cn } from "@/lib/utils";

type ShelfControlsProps = {
  search: string;
  sort: SortOption;
  onSearchChange: (value: string) => void;
  onSortChange: (value: SortOption) => void;
  hideAddBook?: boolean;
  trailingAction?: React.ReactNode;
};

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export function ShelfControls({
  search,
  sort,
  onSearchChange,
  onSortChange,
  hideAddBook = false,
  trailingAction,
}: ShelfControlsProps) {
  return (
    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-end">
      <div className="w-full sm:max-w-md">
        <label htmlFor="shelf-search" className="mb-1 block text-xs font-medium text-text-muted/90">
          Search
        </label>
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted/70" />
          <input
            id="shelf-search"
            type="search"
            placeholder="Title or author..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className={cn(
              "w-full rounded-xl border border-[#eadbc8]/80 bg-background-elevated/60 py-2.5 pl-[42px] pr-4 text-sm text-text",
              "placeholder:text-soft-gray/90 shadow-sm transition-all",
              "hover:border-primary/25 hover:bg-background-elevated/80",
              "focus:border-primary/35 focus:bg-background-elevated focus:outline-none focus:ring-4 focus:ring-primary/10",
            )}
          />
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-2.5 sm:ml-auto">
        <div className="flex items-center gap-2.5">
          <label htmlFor="shelf-sort" className="text-xs font-medium text-text-muted">
            Sort
          </label>
          <select
            id="shelf-sort"
            value={sort}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="rounded-xl border border-[#eadbc8]/80 bg-background-elevated/60 px-3 py-2.5 text-sm text-text transition-colors hover:border-primary/25 focus:border-primary/30 focus:outline-none focus:ring-4 focus:ring-primary/10"
          >
            <option value="recent">Recently opened</option>
            <option value="added">Date added</option>
            <option value="progress">Progress</option>
          </select>
        </div>
        {trailingAction}
        {!hideAddBook && (
          <Link href="/shelf/add" className="group">
            <Button
              size="sm"
              className="gap-1.5 px-3.5 shadow-md transition-transform duration-200 group-hover:-translate-y-0.5"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="h-3.5 w-3.5"
                aria-hidden
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              Add Book
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
