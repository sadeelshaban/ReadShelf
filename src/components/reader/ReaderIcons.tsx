import { cn } from "@/lib/utils";

type IconProps = {
  className?: string;
};

export function CursorIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={cn("h-[18px] w-[18px]", className)} aria-hidden>
      <path d="M5.5 3.21l12.02 9.36-5.4 1.02 2.18 6.38-2.67 1.01-2.18-6.38-5.15 3.79z" />
    </svg>
  );
}

/** Slanted marker body — wide highlighter tip */
export function HighlighterIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn("h-[18px] w-[18px]", className)} aria-hidden>
      <path
        d="M3.5 19.5 12 11l6.5 6.5-2 2.5H5.5l-2-0.5z"
        fill="currentColor"
        opacity="0.35"
      />
      <path
        d="M11.5 8.5 16 4l4 4-4.5 4.5-4-4z"
        fill="currentColor"
      />
      <rect
        x="2.5"
        y="18.5"
        width="10"
        height="3.5"
        rx="1.2"
        fill="currentColor"
        opacity="0.85"
      />
    </svg>
  );
}

/** Fine pen nib — clearly different from marker */
export function PenIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn("h-[18px] w-[18px]", className)} aria-hidden>
      <path
        d="M14.5 3.5 20.5 9.5 8 22 4 23l1-4L14.5 3.5z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M14 4l6 6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="5.5" cy="20.5" r="1.2" fill="currentColor" />
    </svg>
  );
}

export function NoteIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn("h-[18px] w-[18px]", className)} aria-hidden>
      <path
        d="M6 4.5h10a1.5 1.5 0 0 1 1.5 1.5V19l-2.8-2.2L12 19l-2.7-2.2L6.5 19V6a1.5 1.5 0 0 1-0.5-1.5z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M8.5 9h6M8.5 12h4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function ChevronUpIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn("h-4 w-4", className)} aria-hidden>
      <path d="M6 14l6-6 6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronDownIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn("h-4 w-4", className)} aria-hidden>
      <path d="M6 10l6 6 6-6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ZoomInIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn("h-[18px] w-[18px]", className)} aria-hidden>
      <circle cx="11" cy="11" r="6.25" stroke="currentColor" strokeWidth="1.6" />
      <path d="M16 16l4.25 4.25" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M11 8v6M8 11h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function ZoomOutIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn("h-[18px] w-[18px]", className)} aria-hidden>
      <circle cx="11" cy="11" r="6.25" stroke="currentColor" strokeWidth="1.6" />
      <path d="M16 16l4.25 4.25" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M8 11h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
