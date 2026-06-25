/**
 * Remove Firebase env vars from .env.local
 * Usage: node scripts/strip-firebase-env.mjs
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, ".env.local");

if (!existsSync(envPath)) {
  console.log("No .env.local found.");
  process.exit(0);
}

let env = readFileSync(envPath, "utf8");

for (const key of [
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
  "FIREBASE_STORAGE_BUCKET",
  "FIREBASE_STORAGE_PUBLIC_BASE_URL",
  "NEXT_PUBLIC_FIREBASE_STORAGE_PUBLIC_BASE_URL",
]) {
  env = env.replace(new RegExp(`^${key}=.*\\n?`, "gm"), "");
}

env = env.replace(/\n# Firebase Storage[\s\S]*?(?=\n# |\n[A-Z_]|$)/, "\n");
env = env.replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";

writeFileSync(envPath, env, "utf8");
console.log("Removed Firebase vars from .env.local");
