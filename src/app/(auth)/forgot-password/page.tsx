"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [accountNotFound, setAccountNotFound] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setAccountNotFound(false);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const body = (await response.json()) as { error?: string; code?: string };

      if (!response.ok) {
        if (body.code === "not_found") {
          setAccountNotFound(true);
        } else {
          setError(body.error ?? "Could not send reset code. Please try again.");
        }
        setLoading(false);
        return;
      }

      router.push(`/forgot-password/verify?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send reset code.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-soft-gray/30 bg-card p-8 shadow-sm">
        <Link href="/" className="font-serif text-2xl font-semibold text-primary">
          ReadShelf
        </Link>
        <h1 className="mt-6 font-serif text-3xl font-semibold text-text">
          Reset password
        </h1>
        <p className="mt-2 text-text/70">
          Enter your email and we&apos;ll send you a reset code.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <Input
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(null);
              setAccountNotFound(false);
            }}
          />
          {accountNotFound && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              No account is registered with this email.{" "}
              <Link
                href={`/signup?email=${encodeURIComponent(email)}`}
                className="font-medium text-primary underline underline-offset-2 hover:text-primary/80"
              >
                Sign up
              </Link>{" "}
              first.
            </p>
          )}
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Sending..." : "Send reset code"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-text/70">
          <Link href="/login" className="text-primary hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
