import { NextResponse } from "next/server";
import { sendUserStorageNotice } from "@/lib/admin/users";
import { requireAdminUser } from "@/lib/admin/require-admin";
import { isEmailConfigured } from "@/lib/email/config";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const admin = await requireAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isEmailConfigured()) {
    return NextResponse.json(
      { error: "SMTP is not configured. Add SMTP_* env vars first." },
      { status: 503 },
    );
  }

  const { id } = await context.params;

  try {
    await sendUserStorageNotice(id, request);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not send storage notice.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
