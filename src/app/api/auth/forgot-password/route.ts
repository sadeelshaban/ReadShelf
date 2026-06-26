import { NextResponse } from "next/server";
import { createRecoveryOtp } from "@/lib/email/auth-links";
import { getSiteUrl, isEmailConfigured } from "@/lib/email/config";
import { sendEmail } from "@/lib/email/send";
import { recoveryOtpEmailHtml } from "@/lib/email/templates";

const GENERIC_MESSAGE = "If that email exists, a reset code has been sent.";

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
      { error: "Email sending is not configured on the server." },
      { status: 503 },
    );
  }

  try {
    const otp = await createRecoveryOtp(email);

    if (otp) {
      const siteUrl = getSiteUrl(request);
      await sendEmail({
        to: email,
        subject: "Your ReadShelf password reset code",
        html: recoveryOtpEmailHtml(siteUrl, otp),
      });
    }

    return NextResponse.json({ ok: true, message: GENERIC_MESSAGE });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not send reset code.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
