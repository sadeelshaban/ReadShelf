import { cn } from "@/lib/utils";

type IconProps = {
  className?: string;
  color?: string;
};

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

export function CursorIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={cn("h-[18px] w-[18px]", className)} aria-hidden>
      <path d="M5.5 3.21l12.02 9.36-5.4 1.02 2.18 6.38-2.67 1.01-2.18-6.38-5.15 3.79z" />
    </svg>
  );
}

export function ShapesIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn("h-[18px] w-[18px]", className)} aria-hidden>
      <circle cx="9" cy="9" r="5.25" stroke="currentColor" strokeWidth="1.55" />
      <rect x="11.25" y="11.25" width="8.5" height="8.5" rx="1.25" stroke="currentColor" strokeWidth="1.55" />
    </svg>
  );
}

export function ShapeRectIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn("h-[18px] w-[18px]", className)} aria-hidden>
      <rect x="5.5" y="6.5" width="13" height="11" rx="1.25" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function ShapeCircleIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn("h-[18px] w-[18px]", className)} aria-hidden>
      <circle cx="12" cy="12" r="6.75" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function ShapeLineIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn("h-[18px] w-[18px]", className)} aria-hidden>
      <path d="M5 18.5 18.5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function ShapeSingleArrowIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn("h-[18px] w-[18px]", className)} aria-hidden>
      <path d="M5.5 18.5 18.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path
        d="M13.5 5.5H18.5V10.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ShapeArrowIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn("h-[18px] w-[18px]", className)} aria-hidden>
      <path d="M5.5 18.5 18.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path
        d="M13.5 5.5H18.5V10.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.5 18.5H5.5V13.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Speech bubble — distinct from sticky note (paper) icon. */
export function CommentIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn("h-[18px] w-[18px]", className)} aria-hidden>
      <path
        d="M5.5 6.5h13a1.5 1.5 0 0 1 1.5 1.5v7.2a1.5 1.5 0 0 1-1.5 1.5H11l-3.6 2.6V16.7H5.5A1.5 1.5 0 0 1 4 15.2V8A1.5 1.5 0 0 1 5.5 6.5z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M8.2 10.2h7.4M8.2 13h5"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function PaletteIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn("h-3 w-3", className)} aria-hidden>
      <path
        d="M12 3a9 9 0 1 0 8.2 12.7c-.4-1.5-1.8-2.4-3.3-2.1-.8.2-1.4.8-1.6 1.6-.3 1.5-1.2 2.9-2.7 3.3A9 9 0 0 1 12 3z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="7.5" cy="10" r="1" fill="currentColor" />
      <circle cx="10.5" cy="7.5" r="1" fill="currentColor" />
      <circle cx="14.5" cy="8" r="1" fill="currentColor" />
      <circle cx="16.5" cy="11.5" r="1" fill="currentColor" />
    </svg>
  );
}

export function ChevronLeftIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn("h-4 w-4", className)} aria-hidden>
      <path d="M14 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronRightIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn("h-4 w-4", className)} aria-hidden>
      <path d="M10 6l6 6-6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MoonIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn("h-[18px] w-[18px]", className)} aria-hidden>
      <path
        d="M20 14.5A8.5 8.5 0 0 1 9.5 4 7 7 0 1 0 20 14.5z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SunIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn("h-[18px] w-[18px]", className)} aria-hidden>
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function FocusIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn("h-[18px] w-[18px]", className)} aria-hidden>
      <path
        d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="3.25" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function GripIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={cn("h-3.5 w-3.5", className)} aria-hidden>
      <circle cx="9" cy="7" r="1.1" />
      <circle cx="15" cy="7" r="1.1" />
      <circle cx="9" cy="12" r="1.1" />
      <circle cx="15" cy="12" r="1.1" />
      <circle cx="9" cy="17" r="1.1" />
      <circle cx="15" cy="17" r="1.1" />
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
