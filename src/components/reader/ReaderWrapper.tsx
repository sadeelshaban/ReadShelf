"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import type { Highlight, Note } from "@/types";
import { PdfReader } from "@/components/reader/PdfReader";

type ReaderWrapperProps = {
  bookId: string;
  bookTitle: string;
  userId: string;
  initialPage: number;
  totalPages: number | null;
  initialHighlights: Highlight[];
  initialNotes: Note[];
};

function ReaderWithPageParam(props: ReaderWrapperProps) {
  const searchParams = useSearchParams();
  const pageParam = searchParams.get("page");
  const parsedPage = pageParam ? Number.parseInt(pageParam, 10) : NaN;
  const startPage =
    Number.isFinite(parsedPage) && parsedPage > 0
      ? parsedPage
      : props.initialPage;

  return <PdfReader {...props} initialPage={startPage} />;
}

export function ReaderWrapper(props: ReaderWrapperProps) {
  return (
    <Suspense
      fallback={
        <div className="acrobat-reader fixed inset-0 z-40 flex items-center justify-center">
          <p className="text-sm text-white/60">Loading reader...</p>
        </div>
      }
    >
      <ReaderWithPageParam {...props} />
    </Suspense>
  );
}
