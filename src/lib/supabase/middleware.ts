import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAdminEmail } from "@/lib/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";

function homePathForUser(user: { email?: string | null }) {
  return isAdminEmail(user.email) ? "/admin" : "/shelf";
}

export async function updateSession(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user;

  const path = request.nextUrl.pathname;
  const isLoginSignupForgot =
    path.startsWith("/login") ||
    path.startsWith("/signup") ||
    path.startsWith("/forgot-password");
  const isProtected =
    path.startsWith("/shelf") ||
    path.startsWith("/book") ||
    path.startsWith("/lists") ||
    path.startsWith("/settings") ||
    path.startsWith("/admin");

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", path);
    return NextResponse.redirect(url);
  }

  if (user && path === "/") {
    const url = request.nextUrl.clone();
    url.pathname = homePathForUser(user);
    return NextResponse.redirect(url);
  }

  if (user && isLoginSignupForgot) {
    const url = request.nextUrl.clone();
    url.pathname = homePathForUser(user);
    return NextResponse.redirect(url);
  }

  const isUserAppRoute =
    path.startsWith("/shelf") ||
    path.startsWith("/book") ||
    path.startsWith("/lists") ||
    path.startsWith("/settings");

  if (user && isAdminEmail(user.email) && isUserAppRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
