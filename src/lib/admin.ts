import type { User } from "@supabase/supabase-js";

function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const emails = getAdminEmails();
  if (!emails.length) return false;
  return emails.includes(email.toLowerCase());
}

export function isAdminUser(user: User | null | undefined): boolean {
  return isAdminEmail(user?.email);
}
