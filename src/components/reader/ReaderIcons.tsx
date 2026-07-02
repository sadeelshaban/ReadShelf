import { cn } from "@/lib/utils";

type IconProps = {
  className?: string;
};

export function MenuIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn("h-[18px] w-[18px]", className)} aria-hidden>
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

export function HomeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn("h-[18px] w-[18px]", className)} aria-hidden>
      <path
        d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-8.5z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SaveIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn("h-[18px] w-[18px]", className)} aria-hidden>
      <path
        d="M5 5h12l2 2v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M8 5V3h8v2M8 13h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function CursorIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={cn("h-[18px] w-[18px]", className)} aria-hidden>
      <path d="M5.5 3.21l12.02 9.36-5.4 1.02 2.18 6.38-2.67 1.01-2.18-6.38-5.15 3.79z" />
    </svg>
  );
}

export function HandIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn("h-[18px] w-[18px]", className)} aria-hidden>
      <path
        d="M8 11V6.5a1.5 1.5 0 0 1 3 0V11M11 11V5.5a1.5 1.5 0 0 1 3 0V11M14 11V6.5a1.5 1.5 0 0 1 3 0V12a5 5 0 0 1-4.5 4.98L9 20.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Wide-tip marker with highlight band — highlighter tool */
export function HighlighterIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn("h-[18px] w-[18px]", className)} aria-hidden>
      <rect x="1.5" y="13.25" width="21" height="5.5" rx="1.25" fill="currentColor" opacity="0.32" />
      <rect
        x="2.5"
        y="6.25"
        width="12.5"
        height="4.75"
        rx="2.4"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="currentColor"
        fillOpacity="0.12"
      />
      <path d="M15 8.6h6.25" stroke="currentColor" strokeWidth="4.25" strokeLinecap="round" />
      <path d="M4.5 8.6h5.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" opacity="0.55" />
    </svg>
  );
}

/** Fine-tip pencil — pen / ink drawing */
export function PenIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn("h-[18px] w-[18px]", className)} aria-hidden>
      <path
        d="M4.25 19.75 14.25 9.75l2.25 2.25-10 10z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.1"
      />
      <path
        d="M14.25 9.75 16.75 7.25 19.75 10.25 17.25 12.75z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M4.25 19.75 2.75 21.25" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path
        d="M16.75 7.25 19.25 4.75 21.25 6.75 18.75 9.25z"
        fill="currentColor"
        fillOpacity="0.42"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path d="M19.25 4.75 21.25 2.75" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/** Block eraser on a page line — eraser tool */
export function EraserIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn("h-[18px] w-[18px]", className)} aria-hidden>
      <path
        d="M4.5 15.25 11.75 8 18.25 14.5 11 21.75z"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.22"
      />
      <path d="M3.5 21.25h17" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" />
      <path d="M7.75 17.5 13.25 12" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" opacity="0.55" />
      <path d="M9.75 19.5 15.25 14" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" opacity="0.55" />
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

export function BookmarkIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn("h-[18px] w-[18px]", className)} aria-hidden>
      <path
        d="M8 4.5h8a1 1 0 0 1 1 1v12.8l-3.2-2.2-2.8 2.2-2.8-2.2L7 18.3V5.5a1 1 0 0 1 1-1z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
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

export function CheckIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn("h-4 w-4", className)} aria-hidden>
      <path
        d="M6 12.5 9.5 16 18 7.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LineThicknessIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn("h-[18px] w-[18px]", className)} aria-hidden>
      <path d="M5 7h14" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <path d="M5 12h14" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" />
      <path d="M5 17h14" stroke="currentColor" strokeWidth="3.25" strokeLinecap="round" />
    </svg>
  );
}
