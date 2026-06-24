"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/shelf";
  const authErrorParam = searchParams.get("error");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [pendingConfirmationEmail, setPendingConfirmationEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        router.replace(redirect);
      }
    });
  }, [redirect, router]);

  const callbackError =
    authErrorParam === "confirmation_failed"
      ? "We could not confirm this email link. Try requesting a new confirmation email."
      : authErrorParam === "missing_confirmation_code"
        ? "This confirmation link is incomplete. Request a fresh confirmation email."
        : null;

  async function resendConfirmation(targetEmail: string) {
    setError(null);
    setMessage(null);
    setResendLoading(true);

    try {
      const supabase = createClient();
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: targetEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/shelf`,
        },
      });

      if (resendError) {
        setError(resendError.message);
        setResendLoading(false);
        return;
      }

      setMessage(
        "A new confirmation email was requested. If nothing arrives, disable Confirm email in Supabase Authentication > Providers > Email while developing locally.",
      );
      setResendLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend confirmation email.");
      setResendLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    setPendingConfirmationEmail(null);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        if (/email not confirmed/i.test(authError.message)) {
          setError("This account is not confirmed yet, so it cannot log in.");
          setPendingConfirmationEmail(email);
          setLoading(false);
          return;
        }
        setError(authError.message);
        setLoading(false);
        return;
      }

      router.push(redirect);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not connect. Check Supabase setup at /setup.",
      );
      setLoading(false);
    }
  }

  return (
    <section className="video-hero-panel relative min-h-screen overflow-hidden">
      <video
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
      >
        <source src="/videos/auth-background.mp4" type="video/mp4" />
      </video>
      <div className="video-auth-overlay absolute inset-0" />

      <div className="relative flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md rounded-[2rem] border border-white/18 bg-white/12 p-8 text-white shadow-[0_24px_70px_rgba(0,0,0,0.22)] backdrop-blur-2xl sm:p-9">
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/88 shadow-sm">
              <span className="font-serif text-lg font-semibold text-primary">R</span>
            </span>
            <span>
              <span className="block font-serif text-2xl font-semibold text-white">
                ReadShelf
              </span>
              <span className="block text-xs uppercase tracking-[0.18em] text-white/58">
                Sign in
              </span>
            </span>
          </Link>

          <h1 className="mt-8 font-serif text-4xl font-semibold tracking-tight text-white">
            Welcome back
          </h1>
          <p className="mt-3 text-sm leading-6 text-white/78 sm:text-base">
            Log in to return to your shelf, continue reading, and pick up where
            you left off.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <Input
              label="Email"
              labelClassName="text-white"
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border-white/20 bg-white/92 text-[#24180f] placeholder:text-[#8a7968] focus:border-[#f0dfc4] focus:bg-white focus:ring-[#f2e3c8]/35"
            />
            <Input
              label="Password"
              labelClassName="text-white"
              type="password"
              name="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border-white/20 bg-white/92 text-[#24180f] placeholder:text-[#8a7968] focus:border-[#f0dfc4] focus:bg-white focus:ring-[#f2e3c8]/35"
            />
            {(error || callbackError) && (
              <p className="rounded-2xl border border-[#e5c79d]/28 bg-[#2f241b]/52 px-4 py-3 text-sm text-[#fff4e3] backdrop-blur-md">
                {error ?? callbackError}
              </p>
            )}
            {message && (
              <p className="rounded-2xl border border-[#d9c7a7]/26 bg-[#f6eedf]/88 px-4 py-3 text-sm text-[#5b4028]">
                {message}
              </p>
            )}
            {pendingConfirmationEmail && (
              <Button
                type="button"
                variant="secondary"
                className="w-full border-white/20 bg-white/88 text-[#5b4028] hover:bg-white"
                disabled={resendLoading}
                onClick={() => void resendConfirmation(pendingConfirmationEmail)}
              >
                {resendLoading ? "Resending confirmation..." : "Resend confirmation email"}
              </Button>
            )}
            <Button type="submit" className="mt-2 w-full" disabled={loading}>
              {loading ? "Signing in..." : "Log in"}
            </Button>
          </form>

          <div className="mt-7 space-y-3 text-center text-sm text-white/72">
            <p>
              <Link href="/forgot-password" className="text-white hover:text-white/85 hover:underline">
                Forgot password?
              </Link>
            </p>
            <p>
              No account?{" "}
              <Link href="/signup" className="font-medium text-[#f2dfbf] hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
