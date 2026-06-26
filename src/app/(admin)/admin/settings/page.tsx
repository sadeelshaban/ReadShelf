import { redirect } from "next/navigation";
import { AdminSettingsClient } from "@/components/admin/AdminSettingsClient";
import { isAdminUser } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/admin/settings");
  }

  if (!isAdminUser(user)) {
    redirect("/shelf");
  }

  return <AdminSettingsClient email={user.email ?? ""} />;
}
