"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchReadingListsClient } from "@/lib/reading-lists/client-queries";
import { isOnline } from "@/lib/offline/online";
import { cn } from "@/lib/utils";

function ListsGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("h-5 w-5", className)} fill="none" aria-hidden>
      <path
        d="M5 6.5h14v12.5l-2.6-1.7L12 19.2l-4.4-1.9L5 19V6.5z"
        stroke="currentColor"
        strokeWidth="1.55"
        strokeLinejoin="round"
      />
      <path
        d="M9 10.5h6M9 13.5h4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Feature card on the shelf — navigates to reading lists without competing in the header. */
export function ReadingListsPromoCard() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (!isOnline()) {
      setCount(0);
      return;
    }
    let cancelled = false;
    void fetchReadingListsClient()
      .then((lists) => {
        if (!cancelled) setCount(lists.length);
      })
      .catch(() => {
        if (!cancelled) setCount(0);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const listsLabel =
    count == null
      ? "…"
      : count === 1
        ? "1 List"
        : `${count} Lists`;

  return (
    <Link
      href="/lists"
      className={cn(
        "group flex min-w-[11.5rem] max-w-sm flex-col gap-1 rounded-2xl border border-[#eadbc8]/90 bg-white px-3.5 py-3 shadow-sm transition",
        "hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md",
      )}
    >
      <span className="flex items-center gap-2 text-primary">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#fff1dc]">
          <ListsGlyph />
        </span>
        <span className="font-serif text-base font-semibold text-text">Reading Lists</span>
      </span>
      <span className="text-xs font-medium text-[#6a5340]">{listsLabel}</span>
      <span className="mt-0.5 text-[11px] text-text-muted transition group-hover:text-primary">
        Organize books by topic →
      </span>
    </Link>
  );
}
