"use client";

import { Button } from "@/components/ui/Button";
import { ReadBookIcon } from "@/components/icons/ReadBookIcon";

type ReadAgainPromptProps = {
  readCount: number;
  onReadAgain: () => void;
  onOpenLastPage: () => void;
};

export function ReadAgainPrompt({
  readCount,
  onReadAgain,
  onOpenLastPage,
}: ReadAgainPromptProps) {
  const timesLabel =
    readCount === 1 ? "You have read this book once." : `You have read this book ${readCount} times.`;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/55 px-6 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#1f1f1f]/95 p-8 text-center shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
          Book complete
        </p>
        <h2 className="mt-3 font-serif text-2xl font-semibold text-white">
          Want to read it again?
        </h2>
        <p className="mt-2 text-sm text-white/65">
          {readCount > 0 ? `${timesLabel} ` : ""}
          Start from page 1 whenever you are ready.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Button size="lg" className="w-full gap-2" onClick={onReadAgain}>
            <ReadBookIcon />
            Read Again
          </Button>
          <button
            type="button"
            onClick={onOpenLastPage}
            className="text-sm font-medium text-white/55 transition hover:text-white/80"
          >
            Open last page
          </button>
        </div>
      </div>
    </div>
  );
}
