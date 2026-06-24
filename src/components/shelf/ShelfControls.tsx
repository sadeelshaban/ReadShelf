"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { SortOption } from "@/types";

type ShelfControlsProps = {
  search: string;
  sort: SortOption;
  onSearchChange: (value: string) => void;
  onSortChange: (value: SortOption) => void;
};

export function ShelfControls({
  search,
  sort,
  onSearchChange,
  onSortChange,
}: ShelfControlsProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="w-full sm:max-w-sm">
        <Input
          label="Search"
          placeholder="Title or author..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className="flex flex-wrap items-end gap-3 sm:ml-auto sm:pl-6">
        <div className="flex items-center gap-2.5">
          <label htmlFor="shelf-sort" className="text-xs font-medium text-text-muted">
            Sort
          </label>
          <select
            id="shelf-sort"
            value={sort}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="rounded-xl border border-white/70 bg-white/55 px-3 py-2.5 text-sm text-text shadow-sm backdrop-blur-sm focus:border-primary/30 focus:outline-none focus:ring-4 focus:ring-primary/10"
          >
            <option value="recent">Recently opened</option>
            <option value="added">Date added</option>
            <option value="progress">Progress</option>
          </select>
        </div>
        <Link href="/shelf/add">
          <Button size="sm">+ Add Book</Button>
        </Link>
      </div>
    </div>
  );
}
