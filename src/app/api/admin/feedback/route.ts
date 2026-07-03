import { NextResponse } from "next/server";
import { listAdminFeedback } from "@/lib/admin/feedback";
import { requireAdminUser } from "@/lib/admin/require-admin";

export async function GET() {
  const admin = await requireAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const feedback = await listAdminFeedback();
    return NextResponse.json({ feedback });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load feedback.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
