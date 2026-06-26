"use client";

import Link from "next/link";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";

export default function EmailConfirmedPage() {
  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.signOut();
  }, []);

  return (
    <AuthShell eyebrow="Email confirmed">
      <h1 className="mt-8 font-serif text-4xl font-semibold tracking-tight text-white">
        You&apos;re all set
      </h1>
      <p className="mt-3 text-sm leading-6 text-white/82 sm:text-base">
        Your email is confirmed and your ReadShelf account is ready.
      </p>
      <p className="mt-4 rounded-2xl border border-[#d9c7a7]/26 bg-[#f6eedf]/88 px-4 py-3 text-sm text-[#5b4028]">
        Return to the log in page in your other tab, or use the button below. Sign in with
        your email and password to open your shelf.
      </p>
      <Link href="/login?confirmed=1" className="mt-6 block">
        <Button className="w-full">Go to log in</Button>
      </Link>
    </AuthShell>
  );
}
