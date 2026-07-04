import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/favicon.ico") {
    return NextResponse.rewrite(new URL("/favicon.png", request.url));
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/favicon.ico",
    "/((?!_next/static|_next/image|standard_fonts|cmaps|wasm|iccs|pdf.worker.min.mjs|api/books/upload-file|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mjs|wasm|bcmap|pfb|ttf|icc)$).*)",
  ],
};
