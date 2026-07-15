import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { AppHeaderFeedbackButton } from "@/components/layout/AppHeaderFeedbackButton";
import { AppHeaderListsLink } from "@/components/layout/AppHeaderListsLink";
import { AppHeaderSettingsLink } from "@/components/layout/AppHeaderSettingsLink";

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
    <header className="sticky top-0 z-40 border-b border-[#eadbc8]/55 bg-background [transform:translateZ(0)]">
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
              <span className="block truncate text-sm font-semibold text-text/90">
                {displayName}
              </span>
            )}
          </div>
        </Link>

        <nav className="flex shrink-0 items-center gap-0.5">
          <AppHeaderListsLink />
          <AppHeaderFeedbackButton />
          <AppHeaderSettingsLink />
        </nav>
      </div>
    </header>
  );
}
