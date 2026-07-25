"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

type CoverArtProps = {
  /** `undefined` = still loading · `null` = no cover · `string` = ready */
  coverUrl: string | null | undefined;
  title: string;
  alt?: string;
  sizes?: string;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
  onError?: () => void;
};

/** Soft pulse while signed cover URLs resolve — never shows "No cover". */
export function CoverArt({
  coverUrl,
  title,
  alt = "",
  sizes = "176px",
  className,
  imageClassName,
  priority,
  onError,
}: CoverArtProps) {
  if (coverUrl) {
    return (
      <Image
        src={coverUrl}
        alt={alt}
        fill
        sizes={sizes}
        className={cn("object-cover object-center", imageClassName)}
        unoptimized
        priority={priority}
        onError={onError}
      />
    );
  }

  if (coverUrl === undefined) {
    return (
      <div
        className={cn(
          "h-full w-full animate-pulse bg-gradient-to-br from-[#efe4d4] via-[#e8dcc8] to-[#dfd0ba]",
          className,
        )}
        aria-hidden
      />
    );
  }

  const initial = title.trim().charAt(0) || "·";

  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center bg-gradient-to-br from-[#f0dfc8] to-[#e2c9a8]",
        className,
      )}
      aria-hidden
    >
      <span className="font-serif text-2xl font-semibold text-primary/35" dir="auto">
        {initial}
      </span>
    </div>
  );
}
