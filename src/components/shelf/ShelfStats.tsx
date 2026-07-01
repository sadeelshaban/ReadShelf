import type { BookWithCounts } from "@/types";

type ShelfStatsProps = {
  books: BookWithCounts[];
};

export function ShelfStats({ books }: ShelfStatsProps) {
  const total = books.length;
  const highlights = books.reduce((sum, b) => sum + b.highlight_count, 0);
  const notes = books.reduce((sum, b) => sum + b.note_count, 0);
  const avgProgress =
    total > 0
      ? Math.round(books.reduce((sum, b) => sum + b.progress_percent, 0) / total)
      : 0;

  const items = [
    { value: String(total), label: total === 1 ? "Book" : "Books" },
    { value: `${avgProgress}%`, label: "Progress" },
    { value: String(highlights), label: highlights === 1 ? "Highlight" : "Highlights" },
    { value: String(notes), label: notes === 1 ? "Note" : "Notes" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-full border border-[#eadbc8]/80 bg-background-elevated/60 px-3.5 py-1.5 text-xs"
        >
          <span className="font-semibold tabular-nums text-text">{item.value}</span>{" "}
          <span className="text-text-muted">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
