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
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
      <div className="w-full lg:max-w-md">
        <Input
          label="Search"
          placeholder="Title or author..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          labelClassName="uppercase tracking-[0.16em] text-text-muted"
          className="border-soft-gray/18 bg-white/72 shadow-none placeholder:text-soft-gray focus:border-primary/20 focus:bg-white focus:ring-primary/8"
        />
      </div>
      <div className="flex flex-wrap items-end gap-3 lg:ml-auto lg:pl-6">
        <div className="flex items-center gap-2.5">
          <label htmlFor="shelf-sort" className="text-xs font-medium text-text-muted">
            Sort
          </label>
          <select
            id="shelf-sort"
            value={sort}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="rounded-2xl border border-soft-gray/18 bg-white/72 px-3.5 py-2.5 text-sm text-text shadow-none focus:border-primary/20 focus:outline-none focus:ring-4 focus:ring-primary/8"
          >
            <option value="recent">Recently opened</option>
            <option value="added">Date added</option>
            <option value="progress">Progress</option>
          </select>
        </div>
        <Link href="/shelf/add">
          <Button size="sm" className="rounded-2xl px-4">
            + Add Book
          </Button>
        </Link>
      </div>
    </div>
  );
}
