import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SettingsClient } from "@/components/settings/SettingsClient";

function getInitialUsername(
  email: string | undefined,
  metadata: Record<string, unknown>,
) {
  const fromMeta =
    (metadata.username as string | undefined) ||
    (metadata.display_name as string | undefined);
  if (fromMeta?.trim()) return fromMeta.trim();
  if (email) return email.split("@")[0];
  return "";
}

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <SettingsClient
      email={user.email ?? ""}
      initialUsername={getInitialUsername(user.email, user.user_metadata ?? {})}
    />
  );
}
