"use client";

import { Button } from "@/components/ui/Button";
import { ReadBookIcon } from "@/components/icons/ReadBookIcon";

type ContinueReadingPromptProps = {
  page: number;
  zoomPercent: number;
  onContinue: () => void;
  onStartOver: () => void;
};

export function ContinueReadingPrompt({
  page,
  zoomPercent,
  onContinue,
  onStartOver,
}: ContinueReadingPromptProps) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/55 px-6 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#1f1f1f]/95 p-8 text-center shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
          Welcome back
        </p>
        <h2 className="mt-3 font-serif text-2xl font-semibold text-white">
          Continue reading from page {page}?
        </h2>
        <p className="mt-2 text-sm text-white/65">
          Your last position is saved at {zoomPercent}% zoom. We will return you to the exact
          spot in the book.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Button size="lg" className="w-full gap-2" onClick={onContinue}>
            <ReadBookIcon />
            Continue Reading
          </Button>
          <button
            type="button"
            onClick={onStartOver}
            className="text-sm font-medium text-white/55 transition hover:text-white/80"
          >
            Start from page 1
          </button>
        </div>
      </div>
    </div>
  );
}
