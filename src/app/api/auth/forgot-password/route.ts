import { NextResponse } from "next/server";
import { createRecoveryLink } from "@/lib/email/auth-links";
import { getSiteUrl, isEmailConfigured } from "@/lib/email/config";
import { sendEmail } from "@/lib/email/send";
import { recoveryEmailHtml } from "@/lib/email/templates";

const GENERIC_MESSAGE = "If that email exists, a reset link has been sent.";

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
    const actionLink = await createRecoveryLink(request, email);

    if (actionLink) {
      const siteUrl = getSiteUrl(request);
      await sendEmail({
        to: email,
        subject: "Reset your ReadShelf password",
        html: recoveryEmailHtml(siteUrl, actionLink),
      });
    }

    return NextResponse.json({ ok: true, message: GENERIC_MESSAGE });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not send reset email.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
