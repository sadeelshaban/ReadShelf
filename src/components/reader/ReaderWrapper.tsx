"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import type { Bookmark, Highlight, Note } from "@/types";
import { isBookFinished } from "@/lib/books/reading-stats";
import { MAX_ZOOM, MIN_ZOOM } from "@/lib/reader/pdf-reader-config";
import { PdfReader } from "@/components/reader/PdfReader";

type ReaderWrapperProps = {
  bookId: string;
  bookTitle: string;
  userId: string;
  initialPage: number;
  initialScrollY: number | null;
  initialZoom: number | null;
  canResume: boolean;
  progressPercent: number;
  readCount: number;
  totalPages: number | null;
  initialHighlights: Highlight[];
  initialNotes: Note[];
  initialBookmarks: Bookmark[];
};

function ReaderWithPageParam(props: ReaderWrapperProps) {
  const searchParams = useSearchParams();
  const pageParam = searchParams.get("page");
  const scrollParam = searchParams.get("scroll");
  const zoomParam = searchParams.get("zoom");
  const noteParam = searchParams.get("note");
  const parsedPage = pageParam ? Number.parseInt(pageParam, 10) : NaN;
  const parsedScroll = scrollParam ? Number.parseFloat(scrollParam) : NaN;
  const parsedZoom = zoomParam ? Number.parseFloat(zoomParam) : NaN;
  const hasPageParam = Number.isFinite(parsedPage) && parsedPage > 0;
  const hasScrollParam = Number.isFinite(parsedScroll) && parsedScroll >= 0;
  const hasZoomParam =
    Number.isFinite(parsedZoom) && parsedZoom >= MIN_ZOOM && parsedZoom <= MAX_ZOOM;
  const isFinished = isBookFinished(props.progressPercent);

  const startPage = hasPageParam ? parsedPage : props.initialPage;
  const restoreScroll =
    props.canResume &&
    !hasPageParam &&
    !isFinished &&
    props.initialScrollY != null &&
    props.initialScrollY > 0;
  const startScrollY = hasScrollParam
    ? parsedScroll
    : restoreScroll
      ? props.initialScrollY
      : null;

  // Annotation jumps pass zoom=0.5. Otherwise keep the saved reading zoom.
  const startZoom = hasZoomParam ? parsedZoom : props.initialZoom;

  return (
    <PdfReader
      {...props}
      initialPage={startPage}
      initialScrollY={startScrollY}
      initialZoom={startZoom}
      focusNoteId={noteParam && noteParam.length > 0 ? noteParam : null}
      restoreScrollPosition={restoreScroll || hasScrollParam}
      showResumePrompt={props.canResume && restoreScroll && !hasPageParam}
      showReadAgainPrompt={props.canResume && !hasPageParam && isFinished}
    />
  );
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
