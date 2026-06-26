"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { PasswordInput } from "@/components/ui/PasswordInput";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace("/login?error=reset_link_expired");
        return;
      }
      setReady(true);
    });
  }, [router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPasswordError(null);
    setConfirmError(null);

    if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setConfirmError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    await supabase.auth.signOut();
    setSuccess(true);
    setLoading(false);

    window.setTimeout(() => {
      router.push("/login?reset=1");
    }, 2800);
  }

  if (!ready && !success) {
    return (
      <AuthShell eyebrow="Reset password">
        <p className="mt-8 text-sm text-white/78">Loading...</p>
      </AuthShell>
    );
  }

  return (
    <AuthShell eyebrow="Reset password">
      {success ? (
        <div className="mt-8 space-y-4">
          <h1 className="font-serif text-4xl font-semibold tracking-tight text-white">
            Password updated
          </h1>
          <p className="text-sm leading-6 text-white/82 sm:text-base">
            Your new password is saved. Taking you to log in...
          </p>
        </div>
      ) : (
        <>
          <h1 className="mt-8 font-serif text-4xl font-semibold tracking-tight text-white">
            Choose a new password
          </h1>
          <p className="mt-3 text-sm leading-6 text-white/78 sm:text-base">
            Enter your new password below. You will use it the next time you log in.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <PasswordInput
              label="New password"
              labelClassName="text-white"
              name="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError(null);
              }}
              error={passwordError ?? undefined}
              className="border-white/20 bg-white/92 text-[#24180f] placeholder:text-[#8a7968] focus:border-[#f0dfc4] focus:bg-white focus:ring-[#f2e3c8]/35"
            />
            <PasswordInput
              label="Confirm new password"
              labelClassName="text-white"
              name="confirmPassword"
              autoComplete="new-password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setConfirmError(null);
              }}
              error={confirmError ?? undefined}
              className="border-white/20 bg-white/92 text-[#24180f] placeholder:text-[#8a7968] focus:border-[#f0dfc4] focus:bg-white focus:ring-[#f2e3c8]/35"
            />
            {error && (
              <p className="rounded-2xl border border-[#e5c79d]/28 bg-[#2f241b]/52 px-4 py-3 text-sm text-[#fff4e3] backdrop-blur-md">
                {error}
              </p>
            )}
            <Button type="submit" className="mt-2 w-full" disabled={loading}>
              {loading ? "Saving..." : "Update password"}
            </Button>
          </form>

          <p className="mt-7 text-center text-sm text-white/72">
            <Link href="/login" className="text-white hover:text-white/85 hover:underline">
              Back to login
            </Link>
          </p>
        </>
      )}
    </AuthShell>
  );
}
