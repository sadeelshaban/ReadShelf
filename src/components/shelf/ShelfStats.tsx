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
    { label: "Books", value: String(total) },
    { label: "Progress", value: `${avgProgress}%` },
    { label: "Highlights", value: String(highlights) },
    { label: "Notes", value: String(notes) },
  ];

  return (
    <div className="flex flex-wrap gap-2.5 lg:justify-end">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-full border border-soft-gray/18 bg-white/72 px-3.5 py-2 text-xs shadow-sm"
        >
          <span className="text-text-muted">{item.label}</span>
          <span className="ml-1.5 font-semibold text-text">{item.value}</span>
        </div>
      ))}
    </div>
  );
}
