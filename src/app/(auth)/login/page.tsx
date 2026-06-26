"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");
  const welcome = searchParams.get("welcome") === "1";
  const confirmed = searchParams.get("confirmed") === "1";
  const reset = searchParams.get("reset") === "1";
  const prefilledEmail = searchParams.get("email") ?? "";
  const [email, setEmail] = useState(prefilledEmail);
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (prefilledEmail) {
      setEmail(prefilledEmail);
    }
  }, [prefilledEmail]);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) return;
      const dest = await fetch("/api/auth/destination").then((r) => r.json());
      const path =
        redirectParam && redirectParam !== "/shelf" && redirectParam !== "/admin"
          ? redirectParam
          : (dest.path as string);
      router.replace(path);
    });
  }, [redirectParam, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setPasswordError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email, password }),
      });

      const body = (await response.json()) as {
        field?: "form" | "password";
        message?: string;
      };

      if (!response.ok) {
        if (body.field === "password") {
          setPasswordError(body.message ?? "Incorrect password. Please try again.");
        } else {
          setFormError(body.message ?? "Incorrect email or password. Please try again.");
        }
        setLoading(false);
        return;
      }

      const dest = await fetch("/api/auth/destination").then((r) => r.json());
      const path =
        redirectParam && redirectParam !== "/shelf" && redirectParam !== "/admin"
          ? redirectParam
          : (dest.path as string);

      router.push(path);
      router.refresh();
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Could not connect. Check Supabase setup at /setup.",
      );
      setLoading(false);
    }
  }

  return (
    <AuthShell eyebrow="Sign in">
      <h1 className="mt-8 font-serif text-4xl font-semibold tracking-tight text-white">
        {welcome ? "Welcome to ReadShelf" : confirmed ? "You're all set" : "Welcome back"}
      </h1>
      <p className="mt-3 text-sm leading-6 text-white/78 sm:text-base">
        {welcome
          ? "Your account is ready. Log in with your email and password to open your shelf."
          : confirmed
            ? "Your email is confirmed. Log in to open your shelf."
            : reset
              ? "Your password was updated. Log in with your new password."
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
          onChange={(e) => {
            setEmail(e.target.value);
            setFormError(null);
          }}
          className="border-white/20 bg-white/92 text-[#24180f] placeholder:text-[#8a7968] focus:border-[#f0dfc4] focus:bg-white focus:ring-[#f2e3c8]/35"
        />
        <PasswordInput
          label="Password"
          labelClassName="text-white"
          name="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setPasswordError(null);
          }}
          error={passwordError ?? undefined}
          className="border-white/20 bg-white/92 text-[#24180f] placeholder:text-[#8a7968] focus:border-[#f0dfc4] focus:bg-white focus:ring-[#f2e3c8]/35"
        />
        {formError && (
          <p className="rounded-2xl border border-[#e5c79d]/28 bg-[#2f241b]/52 px-4 py-3 text-sm text-[#fff4e3] backdrop-blur-md">
            {formError}
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
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
