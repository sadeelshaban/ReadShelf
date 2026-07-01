import { cn } from "@/lib/utils";

type IconProps = {
  className?: string;
};

export function TabHighlighterIcon({ className }: IconProps) {
  return (
    <svg
      className={cn("h-5 w-5 shrink-0", className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m9 11-6 6v3h3l6-6M20.5 3.5a2.12 2.12 0 0 0-3 3L7 17l-3 1 1-3 10.5-10.5a2.12 2.12 0 0 1 3-3Z"
      />
    </svg>
  );
}

export function TabNoteIcon({ className }: IconProps) {
  return (
    <svg
      className={cn("h-5 w-5 shrink-0", className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 2v6h6" />
      <path strokeLinecap="round" d="M16 13H8M16 17H8M10 9H8" />
    </svg>
  );
}

export function TabBookmarkIcon({ className }: IconProps) {
  return (
    <svg
      className={cn("h-5 w-5 shrink-0", className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 4.5h8a1 1 0 0 1 1 1v12.8l-3.2-2.2-2.8 2.2-2.8-2.2L7 18.3V5.5a1 1 0 0 1 1-1z"
      />
    </svg>
  );
}
