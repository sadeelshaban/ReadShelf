"use client";

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
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

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

  async function handleChangePassword() {
    setPasswordError(null);
    setPasswordLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const body = (await response.json()) as { error?: string };

      if (!response.ok) {
        setPasswordError(body.error ?? "Could not send reset code. Please try again.");
        setPasswordLoading(false);
        return;
      }

      router.push(
        `/forgot-password/verify?email=${encodeURIComponent(email)}&from=settings`,
      );
    } catch (err) {
      setPasswordError(
        err instanceof Error ? err.message : "Could not send reset code.",
      );
      setPasswordLoading(false);
    }
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
        <p className="mt-4 text-sm text-text/75">
          We&apos;ll email a reset code to <span className="font-medium text-text">{email}</span>.
          Enter the code on the next screen, then choose a new password.
        </p>
        {passwordError && (
          <p className="mt-3 text-sm text-red-600">{passwordError}</p>
        )}
        <Button
          variant="secondary"
          size="md"
          className="mt-4 transition-transform hover:-translate-y-0.5"
          disabled={passwordLoading}
          onClick={() => void handleChangePassword()}
        >
          {passwordLoading ? "Sending code..." : "Send reset code"}
        </Button>
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
        <p className="mt-2 text-xs text-text-muted">Full export coming soon.</p>
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
