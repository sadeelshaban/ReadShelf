import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const standaloneDir = path.join(root, ".next", "standalone");
const staticDir = path.join(root, ".next", "static");
const publicDir = path.join(root, "public");
const envLocal = path.join(root, ".env.local");

if (!existsSync(path.join(standaloneDir, "server.js"))) {
  console.error("Missing .next/standalone/server.js — run `npm run build` first.");
  process.exit(1);
}

const targetStatic = path.join(standaloneDir, ".next", "static");
const targetPublic = path.join(standaloneDir, "public");

mkdirSync(path.dirname(targetStatic), { recursive: true });
rmSync(targetStatic, { recursive: true, force: true });
cpSync(staticDir, targetStatic, { recursive: true });

rmSync(targetPublic, { recursive: true, force: true });
cpSync(publicDir, targetPublic, { recursive: true });

if (existsSync(envLocal)) {
  cpSync(envLocal, path.join(standaloneDir, ".env.local"));
  console.log("Included .env.local in desktop bundle.");
} else {
  console.warn("No .env.local found — configure Supabase before packaging the desktop app.");
}

console.log("Desktop bundle prepared.");
