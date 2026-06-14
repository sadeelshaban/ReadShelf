import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const source = path.join(
  root,
  "node_modules",
  "pdfjs-dist",
  "legacy",
  "build",
  "pdf.worker.min.mjs",
);
const targetDir = path.join(root, "public");
const target = path.join(targetDir, "pdf.worker.min.mjs");

if (!existsSync(source)) {
  console.warn("pdfjs worker not found — run npm install first.");
  process.exit(0);
}

mkdirSync(targetDir, { recursive: true });
copyFileSync(source, target);
console.log("Copied pdf.worker.min.mjs to public/.");
