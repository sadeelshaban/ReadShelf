import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createBookUploadUrls } from "@/lib/storage";

type UploadUrlsBody = {
  bookId: string;
  pdfPath: string;
  coverPath: string;
  coverContentType?: string;
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: UploadUrlsBody;
  try {
    body = (await request.json()) as UploadUrlsBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body.bookId || !body.pdfPath || !body.coverPath) {
    return NextResponse.json({ error: "Missing upload paths." }, { status: 400 });
  }

  const userPrefix = `${user.id}/`;
  if (
    !body.pdfPath.startsWith(userPrefix) ||
    !body.coverPath.startsWith(userPrefix)
  ) {
    return NextResponse.json({ error: "Invalid upload path." }, { status: 403 });
  }

  const upload = await createBookUploadUrls({
    pdfPath: body.pdfPath,
    coverPath: body.coverPath,
    coverContentType: body.coverContentType ?? "image/jpeg",
  });

  return NextResponse.json(upload);
}
