import type { User } from "@supabase/supabase-js";
import { isAdminEmail } from "@/lib/admin";
import { storageNoticeEmailHtml } from "@/lib/email/admin-templates";
import { getSiteUrl } from "@/lib/email/config";
import { sendEmail } from "@/lib/email/send";
import { formatStorageBytes, getUserStorageUsageMap } from "@/lib/admin/storage-usage";
import { isUserOnline } from "@/lib/presence";
import { createServiceClient } from "@/lib/supabase/service";

export type AdminUserRow = {
  id: string;
  email: string;
  name: string;
  isOnline: boolean;
  lastSeenAt: string | null;
  lastSignInAt: string | null;
  createdAt: string;
  isAdmin: boolean;
  storageBytes: number;
  bookCount: number;
};

function displayName(user: User): string {
  const metadata = user.user_metadata ?? {};
  const fromMeta =
    (metadata.username as string | undefined) ||
    (metadata.display_name as string | undefined);
  if (fromMeta?.trim()) return fromMeta.trim();
  if (user.email) return user.email.split("@")[0] ?? "User";
  return "User";
}

function toRow(
  user: User,
  lastSeenAt: string | null,
  usage: { storageBytes: number; bookCount: number },
): AdminUserRow {
  return {
    id: user.id,
    email: user.email ?? "",
    name: displayName(user),
    isOnline: isUserOnline(lastSeenAt),
    lastSeenAt,
    lastSignInAt: user.last_sign_in_at ?? null,
    createdAt: user.created_at,
    isAdmin: isAdminEmail(user.email),
    storageBytes: usage.storageBytes,
    bookCount: usage.bookCount,
  };
}

export async function listAdminUsers(): Promise<AdminUserRow[]> {
  const supabase = createServiceClient();
  const users: User[] = [];
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 1000,
    });

    if (error) {
      throw new Error(error.message);
    }

    users.push(...data.users);

    if (data.users.length < 1000) break;
    page += 1;
  }

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, last_seen_at");

  if (profilesError) {
    throw new Error(profilesError.message);
  }

  const lastSeenByUser = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile.last_seen_at as string | null]),
  );

  const usageByUser = await getUserStorageUsageMap(users.map((user) => user.id));

  return users
    .map((user) =>
      toRow(user, lastSeenByUser.get(user.id) ?? null, usageByUser.get(user.id) ?? {
        storageBytes: 0,
        bookCount: 0,
      }),
    )
    .sort((a, b) => b.storageBytes - a.storageBytes || b.createdAt.localeCompare(a.createdAt));
}

export async function signOutUserGlobally(userId: string) {
  const supabase = createServiceClient();
  const { error } = await supabase.rpc("revoke_user_sessions", {
    target_user_id: userId,
  });

  if (error) {
    throw new Error(error.message || "Could not sign out user.");
  }
}

async function removeUserStorage(userId: string) {
  const supabase = createServiceClient();
  const { data: books, error } = await supabase
    .from("books")
    .select("pdf_path, cover_path")
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  const pdfPaths = (books ?? []).map((b) => b.pdf_path).filter(Boolean);
  const coverPaths = (books ?? [])
    .map((b) => b.cover_path)
    .filter((p): p is string => Boolean(p));

  if (pdfPaths.length) {
    const { error: pdfError } = await supabase.storage
      .from("book-pdfs")
      .remove(pdfPaths);
    if (pdfError) {
      throw new Error(pdfError.message);
    }
  }

  if (coverPaths.length) {
    const { error: coverError } = await supabase.storage
      .from("book-covers")
      .remove(coverPaths);
    if (coverError) {
      throw new Error(coverError.message);
    }
  }
}

export async function sendUserStorageNotice(userId: string, request?: Request) {
  const supabase = createServiceClient();
  const { data, error: userError } = await supabase.auth.admin.getUserById(userId);

  if (userError || !data.user) {
    throw new Error(userError?.message ?? "User not found.");
  }

  const email = data.user.email?.trim();
  if (!email) {
    throw new Error("User has no email address.");
  }

  const usage = (await getUserStorageUsageMap([userId])).get(userId) ?? {
    storageBytes: 0,
    bookCount: 0,
  };

  const siteUrl = getSiteUrl(request);
  const usageLabel = formatStorageBytes(usage.storageBytes);

  await sendEmail({
    to: email,
    subject: `ReadShelf — please reduce shelf storage (${usageLabel})`,
    html: storageNoticeEmailHtml({
      siteUrl,
      storageBytes: usage.storageBytes,
      bookCount: usage.bookCount,
    }),
  });
}

export async function unregisterUser(userId: string) {
  const supabase = createServiceClient();
  const { data, error: userError } = await supabase.auth.admin.getUserById(userId);

  if (userError || !data.user) {
    throw new Error(userError?.message ?? "User not found.");
  }

  if (isAdminEmail(data.user.email)) {
    throw new Error("Admin accounts cannot be removed from here.");
  }

  await removeUserStorage(userId);

  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) {
    throw new Error(error.message);
  }
}
