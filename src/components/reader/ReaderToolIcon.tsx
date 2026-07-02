import Image from "next/image";
import { cn } from "@/lib/utils";

export const READER_TOOL_ICONS = {
  highlighter: "/reader-icons/highlighter.png",
  pen: "/reader-icons/pen.png",
  note: "/reader-icons/note.png",
  eraser: "/reader-icons/eraser.png",
  hand: "/reader-icons/hand.png",
  bookmark: "/reader-icons/bookmark.png",
  save: "/reader-icons/save.png",
} as const;

type ReaderToolIconProps = {
  src: string;
  alt: string;
  className?: string;
  accentColor?: string;
};

export function ReaderToolIcon({ src, alt, className, accentColor }: ReaderToolIconProps) {
  return (
    <span className={cn("relative inline-flex h-[18px] w-[18px] items-center justify-center", className)}>
      <Image
        src={src}
        alt={alt}
        width={18}
        height={18}
        className="reader-tool-icon-img h-[18px] w-[18px] object-contain"
        unoptimized
        draggable={false}
      />
      {accentColor && (
        <span
          className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full ring-1 ring-[var(--reader-icon-color)]"
          style={{ backgroundColor: accentColor }}
          aria-hidden
        />
      )}
    </span>
  );
}
