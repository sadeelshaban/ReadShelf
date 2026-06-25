/**
 * Append SUPABASE_SERVICE_ROLE_KEY to .env.local via Supabase CLI.
 * Usage: node scripts/fetch-service-role-env.mjs
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, ".env.local");

if (!existsSync(envPath)) {
  console.error("Missing .env.local");
  process.exit(1);
}

let env = readFileSync(envPath, "utf8");
if (/^SUPABASE_SERVICE_ROLE_KEY=/m.test(env)) {
  console.log("SUPABASE_SERVICE_ROLE_KEY already set.");
  process.exit(0);
}

const urlMatch = env.match(/^NEXT_PUBLIC_SUPABASE_URL=https:\/\/([^.]+)\.supabase\.co/m);
if (!urlMatch) {
  console.error("Could not read project ref from NEXT_PUBLIC_SUPABASE_URL");
  process.exit(1);
}

const projectRef = urlMatch[1];
const output = execSync(
  `npx --yes supabase projects api-keys --project-ref ${projectRef}`,
  { encoding: "utf8", cwd: root },
);
const { keys } = JSON.parse(output.trim());
const serviceKey =
  keys.find((k) => k.id === "service_role" || k.name === "service_role")?.api_key ??
  keys.find((k) => k.type === "secret")?.api_key;

if (!serviceKey) {
  console.error("Could not find service_role key.");
  process.exit(1);
}

env = env.trimEnd() + `\nSUPABASE_SERVICE_ROLE_KEY=${serviceKey}\n`;
writeFileSync(envPath, env, "utf8");
console.log("Added SUPABASE_SERVICE_ROLE_KEY to .env.local (local only, not for Vercel).");
