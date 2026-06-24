"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function SignupPage() {
  const router = useRouter();
  const redirectTimerRef = useRef<number | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        window.clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  function isExistingAccountError(message: string) {
    return /already registered|already exists|already been registered/i.test(message);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setSignupSuccess(false);

    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        if (isExistingAccountError(authError.message)) {
          setError("An account with this email already exists. Try logging in instead.");
        } else {
          setError(authError.message);
        }
        setLoading(false);
        return;
      }

      if (data.user && (data.user.identities?.length ?? 0) === 0) {
        setError("An account with this email already exists. Try logging in instead.");
        setLoading(false);
        return;
      }

      if (data.session) {
        await supabase.auth.signOut();
      }

      setSignupSuccess(true);
      setLoading(false);

      redirectTimerRef.current = window.setTimeout(() => {
        const loginUrl = new URL("/login", window.location.origin);
        loginUrl.searchParams.set("welcome", "1");
        loginUrl.searchParams.set("email", email);
        router.push(`${loginUrl.pathname}${loginUrl.search}`);
      }, 2800);
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
                Sign up
              </span>
            </span>
          </Link>

          {signupSuccess ? (
            <div className="mt-8 space-y-4">
              <h1 className="font-serif text-4xl font-semibold tracking-tight text-white">
                Welcome to ReadShelf
              </h1>
              <p className="text-sm leading-6 text-white/82 sm:text-base">
                Your account was created successfully.
              </p>
              <p className="rounded-2xl border border-[#d9c7a7]/26 bg-[#f6eedf]/88 px-4 py-3 text-sm text-[#5b4028]">
                Taking you to log in now. Enter your email and password to open your
                shelf.
              </p>
            </div>
          ) : (
            <>
              <h1 className="mt-8 font-serif text-4xl font-semibold tracking-tight text-white">
                Create your shelf
              </h1>
              <p className="mt-3 text-sm leading-6 text-white/78 sm:text-base">
                Start saving books, notes, and highlights in one private reading
                space built around your library.
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
        </div>
      </div>
    </section>
  );
}
