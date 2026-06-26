/**
 * Push auth settings (email confirmation + templates) to linked Supabase project.
 * Usage: npm run apply:supabase-auth
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function getProjectRef() {
  const envPath = resolve(root, ".env.local");
  const env = readFileSync(envPath, "utf8");
  const match = env.match(/^NEXT_PUBLIC_SUPABASE_URL=https:\/\/([^.]+)\.supabase\.co/m);
  if (!match) throw new Error("Could not read project ref from .env.local");
  return match[1];
}

const projectRef = getProjectRef();

console.log(`Applying auth config to project ${projectRef}...`);

execSync(`npx --yes supabase config push --project-ref ${projectRef} --yes`, {
  cwd: root,
  stdio: "inherit",
});

console.log("Done. Verify in Supabase Dashboard:");
console.log("  Authentication -> URL Configuration -> Redirect URLs include:");
console.log("    https://readshelf-rust.vercel.app/**");
console.log("    http://localhost:3000/**");
