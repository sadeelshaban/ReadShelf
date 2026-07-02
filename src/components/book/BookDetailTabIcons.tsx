import Image from "next/image";
import { READER_TOOL_ICONS } from "@/components/reader/ReaderToolIcon";
import { cn } from "@/lib/utils";

type IconProps = {
  className?: string;
  active?: boolean;
  size?: "sm" | "md" | "lg";
};

const SIZE_CLASS = {
  sm: "h-[18px] w-[18px]",
  md: "h-5 w-5",
  lg: "h-12 w-12",
} as const;

function BookDetailToolIcon({
  src,
  alt,
  className,
  active = false,
  size = "md",
}: IconProps & { src: string; alt: string }) {
  const dimension = size === "lg" ? 48 : size === "md" ? 20 : 18;

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center",
        SIZE_CLASS[size],
        className,
      )}
      data-active={active ? "true" : undefined}
    >
      <Image
        src={src}
        alt={alt}
        width={dimension}
        height={dimension}
        className={cn(
          "book-detail-tool-icon object-contain",
          SIZE_CLASS[size],
        )}
        unoptimized
        draggable={false}
      />
    </span>
  );
}

export function TabHighlighterIcon({ className, active, size }: IconProps) {
  return (
    <BookDetailToolIcon
      src={READER_TOOL_ICONS.highlighter}
      alt="Highlights"
      className={className}
      active={active}
      size={size}
    />
  );
}

export function TabNoteIcon({ className, active, size }: IconProps) {
  return (
    <BookDetailToolIcon
      src={READER_TOOL_ICONS.note}
      alt="Notes"
      className={className}
      active={active}
      size={size}
    />
  );
}

export function TabBookmarkIcon({ className, active, size }: IconProps) {
  return (
    <BookDetailToolIcon
      src={READER_TOOL_ICONS.bookmark}
      alt="Bookmarks"
      className={className}
      active={active}
      size={size}
    />
  );
}
