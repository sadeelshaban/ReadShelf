import { NextResponse } from "next/server";
import { isAdminUser } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ path: "/login" });
  }

  return NextResponse.json({
    path: isAdminUser(user) ? "/admin" : "/shelf",
  });
}
