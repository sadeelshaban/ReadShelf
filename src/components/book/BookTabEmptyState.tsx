type BookTabEmptyStateProps = {
  variant: "highlights" | "notes";
};

function HighlighterIcon() {
  return (
    <svg
      className="h-6 w-6 text-[#5b4028]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 20h4l10.5-10.5a2.12 2.12 0 1 0-3-3L5 17v3Z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="m13.5 6.5 3 3" />
    </svg>
  );
}

function NotesIcon() {
  return (
    <svg
      className="h-6 w-6 text-[#5b4028]"
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
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </svg>
  );
}

const COPY = {
  highlights: {
    title: "No highlights yet.",
    description: "Start reading to add your favorite passages.",
  },
  notes: {
    title: "No notes yet.",
    description: "Click 'Start Reading' to take notes while reading.",
  },
} as const;

export function BookTabEmptyState({ variant }: BookTabEmptyStateProps) {
  const { title, description } = COPY[variant];

  return (
    <div className="flex min-h-[18rem] flex-col items-center justify-center rounded-2xl bg-[#f7f1e5]/75 px-6 py-12 text-center">
      <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#ebe4d8]">
        {variant === "highlights" ? <HighlighterIcon /> : <NotesIcon />}
      </span>
      <h3 className="font-serif text-xl font-semibold text-[#3c2a21]">{title}</h3>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-[#8a7968]">{description}</p>
    </div>
  );
}
