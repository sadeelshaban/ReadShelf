import Link from "next/link";
import { Button } from "@/components/ui/Button";

type BookTabEmptyStateProps = {
  variant: "highlights" | "notes" | "bookmarks";
  bookId: string;
};

function BookOpenIllustration() {
  return (
    <svg
      className="h-16 w-16 text-[#8B6F52]"
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 14c0-2.2 1.8-4 4-4h14v44H16c-2.2 0-4-1.8-4-4V14Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M36 10h14c2.2 0 4 1.8 4 4v36c0 2.2-1.8 4-4 4H36V10Z"
      />
      <path strokeLinecap="round" d="M32 10v44" />
      <path strokeLinecap="round" d="M18 22h8M18 28h8M42 22h8M42 28h8" />
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
    <div className="book-tab-panel flex min-h-[18rem] flex-col items-center justify-center px-6 py-12 text-center">
      <span className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl border border-[#eadbc8]/80 bg-[#fff8f1] shadow-[0_12px_28px_rgba(0,0,0,0.08)]">
        <BookOpenIllustration />
      </span>
      <h3 className="font-serif text-2xl font-semibold text-[#3c2a21]">{title}</h3>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-[#8a7968]">{description}</p>
      <Link href={`/book/${bookId}/read`} className="mt-8">
        <Button className="h-11 gap-2 px-6">
          <BookOpenIcon />
          Start Reading
        </Button>
      </Link>
    </div>
  );
}
