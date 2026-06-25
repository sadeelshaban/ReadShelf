import { NextResponse } from "next/server";
import { signOutUserGlobally } from "@/lib/admin/users";
import { requireAdminUser } from "@/lib/admin/require-admin";
import { createServiceClient } from "@/lib/supabase/service";
import { isAdminEmail } from "@/lib/admin";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const admin = await requireAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;

  const supabase = createServiceClient();
  const { data, error: userError } = await supabase.auth.admin.getUserById(id);

  if (userError || !data.user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (isAdminEmail(data.user.email) && id !== admin.id) {
    return NextResponse.json({ error: "Cannot sign out another admin." }, { status: 400 });
  }

  try {
    await signOutUserGlobally(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not sign out user.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
