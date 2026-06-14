import { NextResponse } from "next/server";
import { getBookById } from "@/lib/books/queries";
import {
  buildAnnotatedPdf,
  contentDispositionAttachment,
  safePdfFilename,
} from "@/lib/pdf/export-annotated";
import { createClient } from "@/lib/supabase/server";
import { downloadBookPdf } from "@/lib/storage";
import type { Highlight, Note } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type RouteParams = { params: Promise<{ id: string }> };

type ExportPayload = {
  highlights?: Highlight[];
  notes?: Note[];
};

async function loadAnnotations(
  bookId: string,
  userId: string,
  payload?: ExportPayload,
) {
  const supabase = await createClient();
  const [{ data: highlights }, { data: notes }] = await Promise.all([
    supabase.from("highlights").select("*").eq("book_id", bookId),
    supabase.from("notes").select("*").eq("book_id", bookId),
  ]);

  const clientHighlights =
    payload?.highlights?.filter(
      (item) => item.book_id === bookId && item.user_id === userId,
    ) ?? [];
  const clientNotes =
    payload?.notes?.filter(
      (item) => item.book_id === bookId && item.user_id === userId,
    ) ?? [];

  return {
    highlights:
      clientHighlights.length > 0 ? clientHighlights : (highlights ?? []),
    notes: clientNotes.length > 0 ? clientNotes : (notes ?? []),
  };
}

async function exportAnnotatedPdf(bookId: string, payload?: ExportPayload) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const book = await getBookById(bookId);
  if (!book) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  const { highlights, notes } = await loadAnnotations(book.id, user.id, payload);

  try {
    const pdfBuffer = await downloadBookPdf(book.pdf_path);
    const annotated = await buildAnnotatedPdf(
      new Uint8Array(pdfBuffer),
      highlights,
      notes,
    );

    const filename = safePdfFilename(book.title);

    return new NextResponse(Buffer.from(annotated), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": contentDispositionAttachment(filename),
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("PDF export failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not export annotated PDF.",
      },
      { status: 500 },
    );
  }
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  return exportAnnotatedPdf(id);
}

export async function POST(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const payload = (await request.json().catch(() => ({}))) as ExportPayload;
  return exportAnnotatedPdf(id, payload);
}
