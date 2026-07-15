"use client";

import { cn } from "@/lib/utils";

type LoadingStateProps = {
  label?: string;
  className?: string;
};

/** Centered loading state with the brand pulse GIF + label. */
export function LoadingState({
  label = "Getting everything ready...",
  className,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3.5 py-16 text-center",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/loading-pulse.gif"
        alt=""
        width={64}
        height={64}
        className="h-16 w-16"
        aria-hidden
      />
      <p className="text-sm text-text-muted">{label}</p>
    </div>
  );
}
