import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/favicon.ico") {
    return NextResponse.rewrite(new URL("/favicon.png", request.url));
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/favicon.ico",
    "/((?!_next/static|_next/image|icons|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
