import { NextResponse } from "next/server";
import { emailIsRegistered } from "@/lib/auth/email-registered";
import { createClient } from "@/lib/supabase/server";

const WRONG_PASSWORD = "Incorrect password. Please try again.";
const EMAIL_NOT_CONFIRMED =
  "Please confirm your email before logging in. Check your inbox for the confirmation link. If you do not see it, check your Spam or Junk folder.";

export async function POST(request: Request) {
  let body: { email?: string; password?: string };

  try {
    body = (await request.json()) as { email?: string; password?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = body.email?.trim() ?? "";
  const password = body.password ?? "";

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  try {
    const exists = await emailIsRegistered(email);
    if (!exists) {
      return NextResponse.json({ field: "not_found" as const }, { status: 404 });
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      const message = error.message.toLowerCase();

      if (message.includes("email not confirmed")) {
        return NextResponse.json(
          { field: "form", message: EMAIL_NOT_CONFIRMED },
          { status: 401 },
        );
      }

      if (
        message.includes("invalid login credentials") ||
        message.includes("invalid credentials")
      ) {
        return NextResponse.json(
          { field: "password", message: WRONG_PASSWORD },
          { status: 401 },
        );
      }

      return NextResponse.json({ field: "form", message: error.message }, { status: 401 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not sign in.";
    return NextResponse.json({ field: "form", message }, { status: 500 });
  }
}
