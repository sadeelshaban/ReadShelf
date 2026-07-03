import { redirect } from "next/navigation";
import { AdminUsersPanel } from "@/components/admin/AdminUsersPanel";
import { isAdminUser } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/admin/users");
  }

  if (!isAdminUser(user)) {
    redirect("/shelf");
  }

  return (
    <div>
      <div className="mb-10">
        <h1 className="font-serif text-4xl font-semibold tracking-tight text-text sm:text-5xl">
          Users
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          Sorted by storage use. Send a storage notice when trial space is tight.
        </p>
      </div>

      <AdminUsersPanel embedded />
    </div>
  );
}
