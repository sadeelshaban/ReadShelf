import { NextResponse } from "next/server";
import { uploadBookFile } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload payload." }, { status: 400 });
  }

  const file = formData.get("file");
  const path = formData.get("path");
  const kind = formData.get("kind");
  const contentType = formData.get("contentType");

  if (!(file instanceof Blob) || file.size === 0 || typeof path !== "string" || typeof kind !== "string") {
    return NextResponse.json({ error: "Missing upload fields." }, { status: 400 });
  }

  if (kind !== "pdf" && kind !== "cover") {
    return NextResponse.json({ error: "Invalid upload kind." }, { status: 400 });
  }

  const userPrefix = `${user.id}/`;
  if (!path.startsWith(userPrefix)) {
    return NextResponse.json({ error: "Invalid upload path." }, { status: 403 });
  }

  try {
    const body = Buffer.from(await file.arrayBuffer());
    await uploadBookFile({
      path,
      kind,
      contentType:
        typeof contentType === "string" && contentType.length > 0
          ? contentType
          : file.type || (kind === "pdf" ? "application/pdf" : "image/jpeg"),
      body,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed." },
      { status: 500 },
    );
  }
}
