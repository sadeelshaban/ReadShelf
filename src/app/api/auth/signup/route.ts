import { NextResponse } from "next/server";
import { createUserAccount } from "@/lib/email/auth-links";

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

  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters." },
      { status: 400 },
    );
  }

  try {
    const result = await createUserAccount(email, password);

    if ("error" in result) {
      if (result.error === "exists") {
        return NextResponse.json(
          { error: "An account with this email already exists. Try logging in instead." },
          { status: 409 },
        );
      }
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not complete signup.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
