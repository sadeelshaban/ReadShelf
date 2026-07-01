import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";

function getDisplayName(email: string | undefined, metadata: Record<string, unknown>) {
  const fromMeta =
    (metadata.username as string | undefined) ||
    (metadata.display_name as string | undefined) ||
    (metadata.full_name as string | undefined);

  if (fromMeta?.trim()) return fromMeta.trim();
  if (email) return email.split("@")[0];
  return "Reader";
}

export async function AppHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const displayName = user
    ? getDisplayName(user.email, user.user_metadata ?? {})
    : null;

  return (
    <header className="sticky top-0 z-40 border-b border-[#eadbc8]/55 bg-background/85 backdrop-blur-xl">
      <div className="flex w-full items-center justify-between gap-4 px-4 py-2.5 sm:px-6 lg:px-8">
        <Link href="/shelf" className="flex min-w-0 items-center gap-3">
          <Image
            src="/logo.png"
            alt="ReadShelf"
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 rounded-lg object-cover"
            unoptimized
          />
          <div className="min-w-0 leading-tight">
            <span className="font-serif text-lg font-semibold text-primary">
              ReadShelf
            </span>
            {displayName && (
              <span className="block truncate text-xs font-medium text-text/80">
                {displayName}
              </span>
            )}
          </div>
        </Link>

        <nav className="flex shrink-0 items-center">
          <Link
            href="/settings"
            aria-label="Settings"
            className="rounded-xl p-2.5 text-text/70 transition-all hover:bg-background-elevated hover:text-primary hover:shadow-sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
              aria-hidden
            >
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </Link>
        </nav>
      </div>
    </header>
  );
}
