"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

type ReadingStats = {
  books: number;
  highlights: number;
  notes: number;
  avgProgress: number;
};

type SettingsClientProps = {
  email: string;
  initialUsername: string;
  readingStats: ReadingStats;
};

const settingsCard =
  "rounded-2xl border border-[#e8dcc8]/90 bg-card p-7 shadow-[0_8px_24px_rgba(31,22,16,0.06)]";

function SettingsSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn(settingsCard, className)}>
      <h2 className="font-serif text-xl font-semibold text-primary">{title}</h2>
      {description && (
        <p className="mt-1.5 text-sm text-text/75">{description}</p>
      )}
      {children}
    </section>
  );
}

export function SettingsClient({
  email,
  initialUsername,
  readingStats,
}: SettingsClientProps) {
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

  const statItems = [
    { value: String(readingStats.books), label: readingStats.books === 1 ? "Book" : "Books" },
    { value: `${readingStats.avgProgress}%`, label: "Avg. progress" },
    { value: String(readingStats.highlights), label: "Highlights" },
    { value: String(readingStats.notes), label: "Notes" },
  ];

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div className="pt-1">
        <h1 className="font-serif text-[2.5rem] font-semibold leading-tight text-text">
          Settings
        </h1>
        <p className="mt-1.5 text-base text-text/85">Manage your ReadShelf account.</p>
      </div>

      <SettingsSection title="Profile" description={`Signed in as ${email}`}>
        <form onSubmit={handleSaveUsername} className="mt-5 space-y-4">
          <Input
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Your display name"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          {message && <p className="text-sm text-green-700">{message}</p>}
          <Button
            type="submit"
            size="md"
            disabled={saving}
            className="min-w-[148px] rounded-[13px] py-2.5 transition-transform hover:-translate-y-0.5"
          >
            {saving ? "Saving..." : "Save username"}
          </Button>
        </form>
      </SettingsSection>

      <SettingsSection title="Reading stats" description="Your shelf at a glance.">
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {statItems.map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-[#eadbc8]/70 bg-background-elevated/50 px-3 py-3 text-center"
            >
              <p className="font-serif text-2xl font-semibold tabular-nums text-primary">
                {item.value}
              </p>
              <p className="mt-0.5 text-[11px] text-text-muted">{item.label}</p>
            </div>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection title="Security">
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link href="/forgot-password">
            <Button variant="secondary" size="md" className="w-full sm:w-auto">
              Change password
            </Button>
          </Link>
          <p className="text-xs text-text-muted">
            We&apos;ll email you a secure reset link.
          </p>
        </div>
      </SettingsSection>

      <SettingsSection title="Preferences">
        <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-[#eadbc8]/70 bg-background-elevated/40 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-text">Theme</p>
            <p className="text-xs text-text-muted">Warm shelf theme (default)</p>
          </div>
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
            Active
          </span>
        </div>
      </SettingsSection>

      <SettingsSection title="Data">
        <p className="mt-4 text-sm text-text/75">
          Export your annotations and reading data as a bundle.
        </p>
        <Button
          variant="secondary"
          size="md"
          className="mt-4"
          disabled
          title="Coming soon"
        >
          Export my data
        </Button>
        <p className="mt-2 text-xs text-text-muted">Full export — coming soon.</p>
      </SettingsSection>

      <SettingsSection title="Account">
        <Button
          variant="danger-outline"
          size="md"
          className="mt-4 min-w-[120px] rounded-[13px] transition-transform hover:-translate-y-0.5"
          onClick={handleLogout}
        >
          Log out
        </Button>
      </SettingsSection>
    </div>
  );
}
