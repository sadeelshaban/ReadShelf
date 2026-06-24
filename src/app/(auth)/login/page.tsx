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
  const welcome = searchParams.get("welcome") === "1";
  const prefilledEmail = searchParams.get("email") ?? "";
  const [email, setEmail] = useState(prefilledEmail);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (prefilledEmail) {
      setEmail(prefilledEmail);
    }
  }, [prefilledEmail]);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        router.replace(redirect);
      }
    });
  }, [redirect, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
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
            {welcome ? "Welcome to ReadShelf" : "Welcome back"}
          </h1>
          <p className="mt-3 text-sm leading-6 text-white/78 sm:text-base">
            {welcome
              ? "Your account is ready. Log in with your email and password to open your shelf."
              : "Log in to return to your shelf, continue reading, and pick up where you left off."}
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
            {error && (
              <p className="rounded-2xl border border-[#e5c79d]/28 bg-[#2f241b]/52 px-4 py-3 text-sm text-[#fff4e3] backdrop-blur-md">
                {error}
              </p>
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
