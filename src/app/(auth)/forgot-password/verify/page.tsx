"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

function VerifyCodeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email")?.trim() ?? "";
  const fromSettings = searchParams.get("from") === "settings";
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!email) {
    return (
      <AuthShell eyebrow="Reset password">
        <div className="mt-8 space-y-4 text-center">
          <p className="text-sm text-white/82">Enter your email first to receive a reset code.</p>
          <Link href="/forgot-password">
            <Button className="w-full">Back to reset password</Button>
          </Link>
        </div>
      </AuthShell>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: "recovery",
    });

    if (verifyError) {
      setError("Incorrect or expired code. Please try again.");
      setLoading(false);
      return;
    }

    router.push("/auth/reset-password");
    router.refresh();
  }

  return (
    <AuthShell eyebrow="Reset password">
      <h1 className="mt-8 font-serif text-4xl font-semibold tracking-tight text-white">
        Enter your code
      </h1>
      <p className="mt-3 text-sm leading-6 text-white/78 sm:text-base">
        We sent a reset code to <strong className="text-white">{email}</strong>.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <Input
          label="Reset code"
          labelClassName="text-white"
          type="text"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          required
          minLength={6}
          maxLength={8}
          value={code}
          onChange={(e) => {
            setCode(e.target.value.replace(/\s/g, ""));
            setError(null);
          }}
          placeholder="123456"
          className="border-white/20 bg-white/92 text-center font-mono text-lg tracking-[0.3em] text-[#24180f] placeholder:text-[#8a7968] focus:border-[#f0dfc4] focus:bg-white focus:ring-[#f2e3c8]/35"
          error={error ?? undefined}
        />
        <Button type="submit" className="mt-2 w-full" disabled={loading}>
          {loading ? "Checking..." : "Continue"}
        </Button>
      </form>

      <p className="mt-7 text-center text-sm text-white/72">
        {fromSettings ? (
          <Link href="/settings" className="text-white hover:text-white/85 hover:underline">
            Back to settings
          </Link>
        ) : (
          <Link href="/forgot-password" className="text-white hover:text-white/85 hover:underline">
            Send a new code
          </Link>
        )}
      </p>
    </AuthShell>
  );
}

export default function ForgotPasswordVerifyPage() {
  return (
    <Suspense>
      <VerifyCodeForm />
    </Suspense>
  );
}
