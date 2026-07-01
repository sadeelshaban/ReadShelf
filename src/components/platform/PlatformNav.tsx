"use client";

const navItems = [
  { href: "#overview", label: "Overview" },
  { href: "#capabilities", label: "Capabilities" },
  { href: "#demo", label: "Demo" },
  { href: "#contact", label: "Contact" },
];

export function PlatformNav({ liveDemoUrl }: { liveDemoUrl: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/50 bg-card/75 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <a href="#overview" className="font-serif text-lg font-semibold text-primary sm:text-xl">
          ReadShelf
        </a>
        <nav className="hidden items-center gap-5 text-sm font-medium text-text-muted md:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="transition-colors hover:text-primary"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <a
          href={liveDemoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl border border-white/70 bg-white/60 px-3.5 py-2 text-sm font-medium text-text shadow-sm transition hover:bg-white/85"
        >
          Live demo
        </a>
      </div>
    </header>
  );
}
