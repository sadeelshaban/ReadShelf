import Link from "next/link";
import type { ReactNode } from "react";

type AuthShellProps = {
  eyebrow: string;
  children: ReactNode;
};

export function AuthShell({ eyebrow, children }: AuthShellProps) {
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
              <img
                src="/favicon.png"
                alt=""
                className="h-7 w-7 object-contain"
                aria-hidden
              />
            </span>
            <span>
              <span className="block font-serif text-2xl font-semibold text-white">
                ReadShelf
              </span>
              <span className="block text-xs uppercase tracking-[0.18em] text-white/58">
                {eyebrow}
              </span>
            </span>
          </Link>
          {children}
        </div>
      </div>
    </section>
  );
}
