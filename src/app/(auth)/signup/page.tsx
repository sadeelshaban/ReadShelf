"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledEmail = searchParams.get("email") ?? "";
  const [email, setEmail] = useState(prefilledEmail);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  useEffect(() => {
    if (prefilledEmail) {
      setEmail(prefilledEmail);
    }
  }, [prefilledEmail]);

  useEffect(() => {
    if (!signupSuccess || !email) return;

    let cancelled = false;
    const startedAt = Date.now();
    const maxWaitMs = 30 * 60 * 1000;

    async function checkConfirmation() {
      try {
        const response = await fetch("/api/auth/confirmation-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const body = (await response.json()) as { confirmed?: boolean };
        if (!cancelled && body.confirmed) {
          router.replace(`/login?confirmed=1&email=${encodeURIComponent(email)}`);
        }
      } catch {
        // Keep polling — confirmation may happen on another device.
      }
    }

    void checkConfirmation();
    const interval = window.setInterval(() => {
      if (Date.now() - startedAt > maxWaitMs) {
        window.clearInterval(interval);
        return;
      }
      void checkConfirmation();
    }, 3000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [signupSuccess, email, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!acceptedTerms) {
      setError("Please accept the Terms of Service and Privacy Policy to continue.");
      return;
    }
    setError(null);
    setLoading(true);
    setSignupSuccess(false);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const body = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(body.error ?? "Could not create account. Please try again.");
        setLoading(false);
        return;
      }

      setSignupSuccess(true);
      setLoading(false);
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
    <AuthShell eyebrow="Sign up">
      {signupSuccess ? (
        <div className="mt-8 space-y-4">
          <h1 className="font-serif text-4xl font-semibold tracking-tight text-white">
            Check your email
          </h1>
          <p className="text-sm leading-6 text-white/82 sm:text-base">
            We sent a confirmation link to <strong className="text-white">{email}</strong>.
            Open it to activate your account.
          </p>
          <p className="text-sm leading-6 text-white/72">
            If you do not see it, check your Spam folder.
          </p>
        </div>
      ) : (
        <>
          <h1 className="mt-8 font-serif text-4xl font-semibold tracking-tight text-white">
            Create your shelf
          </h1>
          <p className="mt-3 text-sm leading-6 text-white/78 sm:text-base">
            Start saving books, notes, and highlights in one private reading space built
            around your library.
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
            <PasswordInput
              label="Password"
              labelClassName="text-white"
              name="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border-white/20 bg-white/92 text-[#24180f] placeholder:text-[#8a7968] focus:border-[#f0dfc4] focus:bg-white focus:ring-[#f2e3c8]/35"
            />
            <label className="flex items-start gap-3 text-sm leading-6 text-white/78">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-white/30 accent-[#7B4B2A]"
                required
              />
              <span>
                I agree to the{" "}
                <Link href="/terms" className="font-medium text-[#f2dfbf] hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="font-medium text-[#f2dfbf] hover:underline">
                  Privacy Policy
                </Link>
                .
              </span>
            </label>
            {error && (
              <p className="rounded-2xl border border-[#e5c79d]/28 bg-[#2f241b]/52 px-4 py-3 text-sm text-[#fff4e3] backdrop-blur-md">
                {error}
              </p>
            )}
            <Button type="submit" className="mt-2 w-full" disabled={loading || !acceptedTerms}>
              {loading ? "Creating account..." : "Sign up"}
            </Button>
          </form>

          <p className="mt-7 text-center text-sm text-white/72">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-[#f2dfbf] hover:underline">
              Log in
            </Link>
          </p>
        </>
      )}
    </AuthShell>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
