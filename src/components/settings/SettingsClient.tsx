"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
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

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="group rounded-xl border border-[#eadbc8]/70 bg-background-elevated/50 px-4 py-5 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_10px_24px_rgba(123,75,42,0.12)]">
      <p className="font-serif text-3xl font-semibold tabular-nums text-primary transition-transform duration-200 group-hover:scale-105 sm:text-[2rem]">
        {value}
      </p>
      <p className="mt-1.5 text-xs font-medium text-text-muted">{label}</p>
    </div>
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
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="pt-1">
        <h1 className="font-serif text-[2.5rem] font-semibold leading-tight text-text">
          Settings
        </h1>
        <p className="mt-1.5 text-base text-text/85">Manage your ReadShelf account.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
        <div className="space-y-5">
          <SettingsSection title="Profile" description={`Signed in as ${email}`}>
            <form onSubmit={handleSaveUsername} className="mt-5 space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="username" className="block text-xs font-medium text-text-muted/90">
                  Username
                </label>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                  <input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Your display name"
                    className="min-w-0 flex-1 rounded-xl border border-white/70 bg-white/55 px-3.5 py-2.5 text-sm text-text shadow-sm backdrop-blur-sm placeholder:text-soft-gray focus:border-primary/30 focus:bg-white/80 focus:outline-none focus:ring-4 focus:ring-primary/10"
                  />
                  <Button
                    type="submit"
                    size="md"
                    disabled={saving}
                    className="shrink-0 rounded-xl px-5 sm:min-w-[120px]"
                  >
                    {saving ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              {message && <p className="text-sm text-green-700">{message}</p>}
            </form>
          </SettingsSection>
        </div>

        <div className="space-y-5">
          <SettingsSection title="Reading stats" description="Your shelf at a glance.">
            <div className="mt-5 grid grid-cols-2 gap-3">
              {statItems.map((item) => (
                <StatCard key={item.label} value={item.value} label={item.label} />
              ))}
            </div>
          </SettingsSection>

          <SettingsSection title="Data">
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <p className="text-sm text-text/75">
                Export your annotations and reading data as a bundle.
              </p>
              <span className="rounded-full border border-[#eadbc8] bg-background-elevated/80 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
                Coming soon
              </span>
            </div>
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
      </div>
    </div>
  );
}
