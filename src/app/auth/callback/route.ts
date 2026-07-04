import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = requestUrl.searchParams.get("next");

  const safeNext =
    nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")
      ? nextPath
      : "/shelf";

  if (!code) {
    const loginUrl = new URL("/login", requestUrl.origin);
    loginUrl.searchParams.set("error", "missing_confirmation_code");
    return NextResponse.redirect(loginUrl);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const loginUrl = new URL("/login", requestUrl.origin);
    loginUrl.searchParams.set("error", "confirmation_failed");
    return NextResponse.redirect(loginUrl);
  }

  await supabase.auth.signOut();

  if (safeNext === "/login") {
    const loginUrl = new URL("/login", requestUrl.origin);
    loginUrl.searchParams.set("confirmed", "1");
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.redirect(new URL(safeNext, requestUrl.origin));
}
