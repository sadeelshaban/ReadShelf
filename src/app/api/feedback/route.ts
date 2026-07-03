import { NextResponse } from "next/server";
import { isFeedbackCategory } from "@/lib/feedback/categories";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { category?: string; message?: string };
  try {
    body = (await request.json()) as { category?: string; message?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const category = body.category?.trim() ?? "";
  const message = body.message?.trim() ?? "";

  if (!isFeedbackCategory(category)) {
    return NextResponse.json({ error: "Please choose a feedback category." }, { status: 400 });
  }

  if (message.length < 3) {
    return NextResponse.json(
      { error: "Please write at least a few words of feedback." },
      { status: 400 },
    );
  }

  if (message.length > 5000) {
    return NextResponse.json(
      { error: "Feedback is too long. Please keep it under 5000 characters." },
      { status: 400 },
    );
  }

  const { error } = await supabase.from("feedback").insert({
    user_id: user.id,
    user_email: user.email,
    category,
    message,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
