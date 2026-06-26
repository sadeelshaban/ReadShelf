/**
 * Create a confirmed demo user for acquisition walkthroughs.
 * Usage: node scripts/create-demo-user.mjs [email] [password]
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvFile() {
  const envPath = resolve(root, ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile();

const email = (process.argv[2] ?? process.env.NEXT_PUBLIC_DEMO_EMAIL ?? "demo@readshelf.app")
  .trim()
  .toLowerCase();
const password = process.argv[3] ?? process.env.DEMO_USER_PASSWORD ?? "ReadShelfDemo2026";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let userId = null;
let page = 1;

while (!userId) {
  const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
  if (error) throw error;
  const found = data.users.find((u) => u.email?.toLowerCase() === email);
  if (found) {
    userId = found.id;
    break;
  }
  if (data.users.length < 1000) break;
  page += 1;
}

if (userId) {
  const { error } = await supabase.auth.admin.updateUserById(userId, {
    password,
    email_confirm: true,
  });
  if (error) throw error;
  console.log(`Updated demo user: ${email}`);
} else {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  userId = data.user.id;
  console.log(`Created demo user: ${email}`);
}

const { error: profileError } = await supabase.from("profiles").upsert(
  { id: userId, is_admin: false },
  { onConflict: "id" },
);

if (profileError) {
  console.warn("Profile upsert:", profileError.message);
}

console.log("");
console.log("Demo credentials (share with buyers during walkthrough):");
console.log(`  Email:    ${email}`);
console.log(`  Password: ${password}`);
console.log(`  Login:    ${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/login`);
console.log("");
console.log("Tip: set NEXT_PUBLIC_DEMO_EMAIL in Vercel to show the email on /platform.");
