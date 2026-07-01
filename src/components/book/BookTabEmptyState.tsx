import Link from "next/link";
import { Button } from "@/components/ui/Button";
import {
  TabBookmarkIcon,
  TabHighlighterIcon,
  TabNoteIcon,
} from "@/components/book/BookDetailTabIcons";
import { ReadBookIcon } from "@/components/icons/ReadBookIcon";

type BookTabEmptyStateProps = {
  variant: "highlights" | "notes" | "bookmarks";
  bookId: string;
};

const COPY = {
  highlights: {
    title: "No highlights yet",
    description:
      "Start reading this book and highlight your favorite passages to see them here.",
    icon: TabHighlighterIcon,
  },
  notes: {
    title: "No notes yet",
    description: "Start reading this book and add notes on any page to see them here.",
    icon: TabNoteIcon,
  },
  bookmarks: {
    title: "No bookmarks yet",
    description: "Use the bookmark tool in the reader to save labeled places you want to return to.",
    icon: TabBookmarkIcon,
  },
} as const;

export function BookTabEmptyState({ variant, bookId }: BookTabEmptyStateProps) {
  const { title, description, icon: VariantIcon } = COPY[variant];

  return (
    <div className="book-tab-panel flex min-h-[18rem] flex-col items-center justify-center px-6 py-12 text-center">
      <span className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl border border-[#eadbc8]/80 bg-[#fff8f1] shadow-[0_12px_28px_rgba(0,0,0,0.08)]">
        <VariantIcon className="h-12 w-12 text-[#8B6F52]" />
      </span>
      <h3 className="font-serif text-2xl font-semibold text-[#3c2a21]">{title}</h3>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-[#8a7968]">{description}</p>
      <Link href={`/book/${bookId}/read`} className="mt-8">
        <Button className="h-11 gap-2 px-6">
          <ReadBookIcon />
          Start Reading
        </Button>
      </Link>
    </div>
  );
}
