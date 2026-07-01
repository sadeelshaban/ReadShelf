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

/** Fine-tip marker with chevron — highlighter tool */
export function HighlighterIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn("h-[18px] w-[18px]", className)} aria-hidden>
      <path
        d="M7 19.5 15.5 11 17.8 13.3 9.3 21.8z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M15.5 11 17.2 9.3 19.2 11.3 17.5 13z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M7 19.5 5.5 21"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M15.8 15.2 17.1 16.7 18.4 15.2"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Chisel-tip marker — draw / pen tool */
export function PenIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn("h-[18px] w-[18px]", className)} aria-hidden>
      <path
        d="M5 19.5 11.5 8.5 15.8 10.8 9.3 21.8z"
        fill="#AB47BC"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M11.5 8.5 14.8 5.2 18.8 9.2 15.8 10.8z"
        fill="#AB47BC"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M14.8 5.2 17.2 3.2 20.2 6.2 18.8 9.2z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function EraserIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn("h-[18px] w-[18px]", className)} aria-hidden>
      <path
        d="m16.5 3.5 4 4-9.5 9.5-4-4L16.5 3.5z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M6 16.5 3 19.5a1.2 1.2 0 0 0 0 1.7l.8.8a1.2 1.2 0 0 0 1.7 0l3-3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10 20h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
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
