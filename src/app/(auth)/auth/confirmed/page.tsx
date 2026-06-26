"use client";

import Link from "next/link";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";

function CheckIcon() {
  return (
    <svg
      className="h-8 w-8 text-[#634832]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default function EmailConfirmedPage() {
  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.signOut();
  }, []);

  return (
    <AuthShell eyebrow="Email confirmed">
      <div className="mt-10 flex flex-col items-center text-center">
        <span className="mb-7 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full border border-[#eadbc8]/40 bg-[#f6eedf]/92 shadow-sm">
          <CheckIcon />
        </span>

        <h1 className="max-w-sm font-serif text-5xl font-semibold leading-tight tracking-tight text-white sm:text-6xl">
          You&apos;re all set
        </h1>

        <p className="mt-5 max-w-sm text-lg leading-relaxed text-white/88">
          Your account is confirmed.
        </p>

        <p className="mt-3 max-w-md text-base leading-relaxed text-white/72">
          Go to the log in page and sign in with your email and password to open your
          shelf.
        </p>

        <Link href="/login?confirmed=1" className="mt-10 w-full max-w-sm">
          <Button className="w-full px-6 py-3.5 text-base">Go to log in</Button>
        </Link>
      </div>
    </AuthShell>
  );
}
