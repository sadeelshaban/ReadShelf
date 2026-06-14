import { NextResponse } from "next/server";
import { getBookById } from "@/lib/books/queries";
import { createClient } from "@/lib/supabase/server";
import { deleteBookFiles } from "@/lib/storage";

type RouteParams = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const book = await getBookById(id);
  if (!book) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  const supabase = await createClient();

  try {
    await deleteBookFiles({
      pdfPath: book.pdf_path,
      coverPath: book.cover_path,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not delete book files.",
      },
      { status: 500 },
    );
  }

  const { error } = await supabase.from("books").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
