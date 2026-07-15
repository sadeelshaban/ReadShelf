"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import type { SortOption } from "@/types";
import { cn } from "@/lib/utils";

type SortChoice = {
  value: string;
  label: string;
};

type ShelfControlsProps = {
  search: string;
  sort: string;
  onSearchChange: (value: string) => void;
  onSortChange: (value: string) => void;
  hideAddBook?: boolean;
  trailingAction?: React.ReactNode;
  searchId?: string;
  searchPlaceholder?: string;
  sortId?: string;
  sortOptions?: SortChoice[];
  /** When set, shows a primary add button instead of the shelf "Add Book" link. */
  onAddClick?: () => void;
  addLabel?: string;
};

const DEFAULT_SORT_OPTIONS: SortChoice[] = [
  { value: "recent", label: "Recently opened" },
  { value: "added", label: "Date added" },
  { value: "progress", label: "Progress" },
];

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

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      className={className}
      aria-hidden
    >
      <path d="M12 5v14M5 12h14" />
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
  searchId = "shelf-search",
  searchPlaceholder = "Title or author...",
  sortId = "shelf-sort",
  sortOptions = DEFAULT_SORT_OPTIONS,
  onAddClick,
  addLabel = "Add Book",
}: ShelfControlsProps) {
  return (
    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-end">
      <div className="w-full sm:max-w-md">
        <label htmlFor={searchId} className="mb-1 block text-xs font-medium text-text-muted/90">
          Search
        </label>
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted/70" />
          <input
            id={searchId}
            type="search"
            placeholder={searchPlaceholder}
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
          <label htmlFor={sortId} className="text-xs font-medium text-text-muted">
            Sort
          </label>
          <select
            id={sortId}
            value={sort}
            onChange={(e) => onSortChange(e.target.value)}
            className="rounded-xl border border-[#eadbc8]/80 bg-background-elevated/60 px-3 py-2.5 text-sm text-text transition-colors hover:border-primary/25 focus:border-primary/30 focus:outline-none focus:ring-4 focus:ring-primary/10"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        {trailingAction}
        {onAddClick ? (
          <Button
            type="button"
            size="sm"
            className="gap-1.5 px-3.5 shadow-md transition-transform duration-200 hover:-translate-y-0.5"
            onClick={onAddClick}
          >
            <PlusIcon className="h-3.5 w-3.5" />
            {addLabel}
          </Button>
        ) : (
          !hideAddBook && (
            <Link href="/shelf/add" className="group">
              <Button
                size="sm"
                className="gap-1.5 px-3.5 shadow-md transition-transform duration-200 group-hover:-translate-y-0.5"
              >
                <PlusIcon className="h-3.5 w-3.5" />
                Add Book
              </Button>
            </Link>
          )
        )}
      </div>
    </div>
  );
}

/** Kept for callers that still type against the original shelf sort union. */
export type { SortOption };
