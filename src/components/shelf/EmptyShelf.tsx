import Link from "next/link";
import { Button } from "@/components/ui/Button";

function EmptyShelfIllustration() {
  return (
    <svg
      className="h-[4.5rem] w-[4.5rem] text-[#8B6F52]"
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 48h48" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 14c0-2.2 1.8-4 4-4h14v34H16c-2.2 0-4-1.8-4-4V14Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M36 10h14c2.2 0 4 1.8 4 4v34c0 2.2-1.8 4-4 4H36V10Z"
      />
      <path strokeLinecap="round" d="M32 10v38" />
      <path strokeLinecap="round" d="M18 22h8M18 28h8M42 22h8M42 28h8" />
    </svg>
  );
}

const FEATURES = [
  "Read PDFs",
  "Highlight passages",
  "Save notes",
] as const;

export function EmptyShelfSkeleton() {
  return (
    <div className="mx-auto flex max-w-lg justify-center py-6 sm:py-10">
      <div
        className="w-full animate-pulse rounded-3xl border border-[#eadbc8]/50 bg-white/80 p-8 sm:p-10"
        aria-hidden
      >
        <div className="mx-auto mb-6 h-28 w-28 rounded-3xl bg-[#f3ece2]" />
        <div className="mx-auto h-7 w-48 rounded-lg bg-[#f3ece2]" />
        <div className="mx-auto mt-3 h-4 w-full max-w-xs rounded bg-[#f3ece2]" />
        <div className="mx-auto mt-2 h-4 w-[80%] max-w-xs rounded bg-[#f3ece2]" />
        <div className="mx-auto mt-8 h-11 w-44 rounded-xl bg-[#eadbc8]/70" />
      </div>
    </div>
  );
}

export function EmptyShelf() {
  return (
    <div className="mx-auto flex max-w-lg justify-center py-4 sm:py-8">
      <div className="w-full rounded-3xl border border-[#eadbc8]/70 bg-white p-8 text-center shadow-[0_12px_40px_rgba(31,22,16,0.08)] sm:p-10">
        <span className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-3xl border border-[#eadbc8]/80 bg-[#fff8f1] shadow-[0_8px_24px_rgba(31,22,16,0.06)]">
          <EmptyShelfIllustration />
        </span>

        <h2 className="font-serif text-2xl font-semibold text-[#3c2a21] sm:text-3xl">
          Your shelf is empty
        </h2>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-[#8a7968]">
          Upload your first PDF to start reading, highlighting, and taking notes — all in one
          place.
        </p>

        <ul className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {FEATURES.map((feature) => (
            <li
              key={feature}
              className="rounded-full bg-[#fff8f1] px-3 py-1 text-xs font-medium text-[#5b4028] ring-1 ring-[#eadbc8]/80"
            >
              {feature}
            </li>
          ))}
        </ul>

        <Link href="/shelf/add" className="mt-8 inline-block">
          <Button size="lg" className="h-11 gap-2 px-6 shadow-[0_8px_24px_rgba(123,75,42,0.22)]">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path strokeLinecap="round" d="M12 5v14M5 12h14" />
            </svg>
            Add your first book
          </Button>
        </Link>

        <p className="mt-4 text-xs text-[#a89888]">PDF up to 50 MB</p>
      </div>
    </div>
  );
}
