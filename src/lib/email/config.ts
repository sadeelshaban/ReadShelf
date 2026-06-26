export function getSiteUrl(request?: Request): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;

  if (request) {
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    const proto = request.headers.get("x-forwarded-proto") ?? "https";
    if (host) return `${proto}://${host}`;
  }

  return "https://readshelf-rust.vercel.app";
}

export function getEmailFrom(): string {
  if (process.env.EMAIL_FROM) return process.env.EMAIL_FROM;

  const user = process.env.SMTP_USER;
  if (user) return `ReadShelf <${user}>`;

  return "ReadShelf <noreply@readshelf.com>";
}

export function isEmailConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS,
  );
}
