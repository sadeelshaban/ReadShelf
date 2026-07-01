import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function EmptyShelf() {
  return (
    <div className="px-6 py-16 text-center">
      <h2 className="font-serif text-2xl font-semibold text-text">
        Your shelf is empty
      </h2>
      <p className="mx-auto mt-3 max-w-md text-text-muted">
        Upload your first PDF to start reading, highlighting, and taking notes.
      </p>
      <Link href="/shelf/add" className="mt-7 inline-block">
        <Button size="lg">+ Add your first book</Button>
      </Link>
    </div>
  );
}
