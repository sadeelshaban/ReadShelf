import { NextResponse } from "next/server";
import { getCoverReadUrl } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const path = new URL(request.url).searchParams.get("path");
  if (!path || !path.startsWith(`${user.id}/`)) {
    return NextResponse.json({ error: "Invalid cover path." }, { status: 403 });
  }

  const url = await getCoverReadUrl(path);
  if (!url) {
    return NextResponse.json({ error: "Cover not found." }, { status: 404 });
  }

  return NextResponse.json({ url });
}
