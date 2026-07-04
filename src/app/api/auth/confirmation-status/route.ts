import { NextResponse } from "next/server";
import { isEmailConfirmed } from "@/lib/auth/email-confirmed";

export async function POST(request: Request) {
  let body: { email?: string };

  try {
    body = (await request.json()) as { email?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = body.email?.trim() ?? "";
  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  try {
    const confirmed = await isEmailConfirmed(email);
    return NextResponse.json({ confirmed: confirmed === true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not check confirmation status.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
