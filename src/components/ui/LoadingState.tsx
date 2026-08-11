"use client";

import { cn } from "@/lib/utils";

type LoadingStateProps = {
  label?: string;
  className?: string;
};

/** Centered loading state with brand pulse bars + label. */
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
      <div className="loading-pulse" aria-hidden>
        <span className="loading-pulse-bar loading-pulse-bar--1" />
        <span className="loading-pulse-bar loading-pulse-bar--2" />
        <span className="loading-pulse-bar loading-pulse-bar--3" />
      </div>
      <p className="text-sm text-text-muted">{label}</p>
    </div>
  );
}
