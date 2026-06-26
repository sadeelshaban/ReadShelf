"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
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
          </p>
          <p className="rounded-2xl border border-[#d9c7a7]/26 bg-[#f6eedf]/88 px-4 py-3 text-sm text-[#5b4028]">
            Open the email, click Confirm Email, then return here to log in and open your
            shelf.
          </p>
          <Link href={`/login?email=${encodeURIComponent(email)}`}>
            <Button className="mt-2 w-full">Go to log in</Button>
          </Link>
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
            {error && (
              <p className="rounded-2xl border border-[#e5c79d]/28 bg-[#2f241b]/52 px-4 py-3 text-sm text-[#fff4e3] backdrop-blur-md">
                {error}
              </p>
            )}
            <Button type="submit" className="mt-2 w-full" disabled={loading}>
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
