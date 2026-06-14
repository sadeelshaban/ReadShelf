"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type SettingsClientProps = {
  email: string;
  initialUsername: string;
};

export function SettingsClient({ email, initialUsername }: SettingsClientProps) {
  const router = useRouter();
  const [username, setUsername] = useState(initialUsername);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSaveUsername(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSaving(true);

    const trimmed = username.trim();
    if (!trimmed) {
      setError("Username cannot be empty.");
      setSaving(false);
      return;
    }

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        username: trimmed,
        display_name: trimmed,
      },
    });

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    setMessage("Username saved.");
    setSaving(false);
    router.refresh();
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-text">Settings</h1>
        <p className="mt-2 text-text/70">Manage your ReadShelf account.</p>
      </div>

      <section className="rounded-2xl border border-soft-gray/30 bg-card p-6">
        <h2 className="font-serif text-xl font-semibold text-primary">Profile</h2>
        <p className="mt-2 text-sm text-text/80">Email: {email}</p>

        <form onSubmit={handleSaveUsername} className="mt-4 space-y-3">
          <Input
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Your display name"
          />
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          {message && (
            <p className="text-sm text-green-700">{message}</p>
          )}
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? "Saving..." : "Save username"}
          </Button>
        </form>
      </section>

      <section className="rounded-2xl border border-soft-gray/30 bg-card p-6">
        <h2 className="font-serif text-xl font-semibold text-primary">Account</h2>
        <Button variant="danger" className="mt-4" onClick={handleLogout}>
          Log out
        </Button>
      </section>
    </div>
  );
}
