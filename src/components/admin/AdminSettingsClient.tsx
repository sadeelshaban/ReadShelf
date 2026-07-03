"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

type AdminSettingsClientProps = {
  email: string;
};

export function AdminSettingsClient({ email }: AdminSettingsClientProps) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut({ scope: "global" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-text sm:text-4xl">Settings</h1>
        <p className="mt-2 text-text-muted">Manage your admin account.</p>
      </div>

      <section className="glass-panel rounded-2xl p-6">
        <h2 className="font-serif text-xl font-semibold text-primary">Account</h2>
        <p className="mt-3 text-sm text-text-muted">
          Signed in as <span className="font-medium text-text">{email}</span>
        </p>
        <Button variant="danger" className="mt-6" onClick={handleLogout}>
          Log out
        </Button>
      </section>
    </div>
  );
}
