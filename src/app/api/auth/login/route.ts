import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";

const WRONG_CREDENTIALS = "Incorrect email or password. Please try again.";
const WRONG_PASSWORD = "Incorrect password. Please try again.";
const EMAIL_NOT_CONFIRMED =
  "Please confirm your email before logging in. Check your inbox for the confirmation link.";

async function emailExists(email: string) {
  const supabase = createServiceClient();
  const normalized = email.trim().toLowerCase();
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 1000,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (data.users.some((user) => user.email?.toLowerCase() === normalized)) {
      return true;
    }

    if (data.users.length < 1000) break;
    page += 1;
  }

  return false;
}

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
    const exists = await emailExists(email);
    if (!exists) {
      return NextResponse.json(
        { field: "form", message: WRONG_CREDENTIALS },
        { status: 401 },
      );
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
