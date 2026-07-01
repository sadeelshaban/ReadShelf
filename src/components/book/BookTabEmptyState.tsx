import Link from "next/link";
import { Button } from "@/components/ui/Button";

type BookTabEmptyStateProps = {
  variant: "highlights" | "notes" | "bookmarks";
  bookId: string;
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

function BookOpenIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
      />
    </svg>
  );
}

const COPY = {
  highlights: {
    title: "No highlights yet",
    description:
      "Start reading this book and highlight your favorite passages to see them here.",
  },
  notes: {
    title: "No notes yet",
    description: "Start reading this book and add notes on any page to see them here.",
  },
  bookmarks: {
    title: "No bookmarks yet",
    description: "Use the bookmark tool in the reader to save labeled places you want to return to.",
  },
} as const;

export function BookTabEmptyState({ variant, bookId }: BookTabEmptyStateProps) {
  const { title, description } = COPY[variant];

  return (
    <div className="flex min-h-[20rem] flex-col items-center justify-center px-6 py-14 text-center">
      <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f3ece2]">
        {variant === "highlights" ? (
          <HighlighterIcon />
        ) : variant === "notes" ? (
          <NotesIcon />
        ) : (
          <NotesIcon />
        )}
      </span>
      <h3 className="font-serif text-2xl font-semibold text-[#3c2a21]">{title}</h3>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-[#8a7968]">{description}</p>
      <Link href={`/book/${bookId}/read`} className="mt-8">
        <Button className="gap-2 px-6">
          <BookOpenIcon />
          Start Reading
        </Button>
      </Link>
    </div>
  );
}
