import { NextResponse } from "next/server";
import { getBookById } from "@/lib/books/queries";
import { downloadBookPdf } from "@/lib/storage";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const book = await getBookById(id);
  if (!book) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  try {
    const data = await downloadBookPdf(book.pdf_path);
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": "application/pdf",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not load PDF",
      },
      { status: 500 },
    );
  }
}
