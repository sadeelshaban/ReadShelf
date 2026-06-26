import { NextResponse } from "next/server";
import { createSignupLink } from "@/lib/email/auth-links";
import { getSiteUrl, isEmailConfigured } from "@/lib/email/config";
import { sendEmail } from "@/lib/email/send";
import { confirmationEmailHtml } from "@/lib/email/templates";

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

  if (!isEmailConfigured()) {
    return NextResponse.json(
      {
        error:
          "Email sending is not configured. Add SMTP_HOST, SMTP_USER, and SMTP_PASS.",
      },
      { status: 503 },
    );
  }

  try {
    const result = await createSignupLink(request, email, password);

    if ("error" in result) {
      if (result.error === "exists") {
        return NextResponse.json(
          { error: "An account with this email already exists. Try logging in instead." },
          { status: 409 },
        );
      }
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    const siteUrl = getSiteUrl(request);
    await sendEmail({
      to: email,
      subject: "Confirm your ReadShelf account",
      html: confirmationEmailHtml(siteUrl, result.actionLink),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not complete signup.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
