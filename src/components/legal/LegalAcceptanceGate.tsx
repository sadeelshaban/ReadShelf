"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { LEGAL_ACCEPTANCE_KEY, legalLinks } from "@/lib/legal/constants";

export function LegalAcceptanceGate() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  const isLegalPage =
    pathname === "/terms" || pathname === "/privacy" || pathname === "/copyright";

  useEffect(() => {
    if (isLegalPage) {
      setVisible(false);
      return;
    }
    try {
      const accepted = window.localStorage.getItem(LEGAL_ACCEPTANCE_KEY);
      if (!accepted) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, [isLegalPage]);

  if (!visible) return null;

  function accept() {
    try {
      window.localStorage.setItem(LEGAL_ACCEPTANCE_KEY, new Date().toISOString());
    } catch {
      // Continue even if storage is unavailable.
    }
    setVisible(false);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/55 p-4 backdrop-blur-sm sm:items-center">
      <div
        role="dialog"
        aria-labelledby="legal-gate-title"
        aria-modal="true"
        className="w-full max-w-lg rounded-2xl border border-white/15 bg-[#1f1f1f]/96 p-6 shadow-2xl sm:p-8"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">
          Before you continue
        </p>
        <h2 id="legal-gate-title" className="mt-2 font-serif text-2xl font-semibold text-white">
          Terms &amp; privacy
        </h2>
        <p className="mt-3 text-sm leading-6 text-white/70">
          By using ReadShelf, you agree to our legal terms. Please review them before
          continuing.
        </p>
        <ul className="mt-4 space-y-2 text-sm">
          {legalLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[#f2dfbf] hover:underline"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Button size="lg" className="w-full sm:flex-1" onClick={accept}>
            I agree and continue
          </Button>
          <Link href="/terms" className="w-full sm:flex-1">
            <Button
              variant="secondary"
              size="lg"
              className="w-full border-white/20 bg-white/10 text-white hover:bg-white/15"
            >
              Read full terms
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
