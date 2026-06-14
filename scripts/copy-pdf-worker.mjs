import { copyFileSync, cpSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const pkgRoot = path.join(root, "node_modules", "pdfjs-dist");
const publicDir = path.join(root, "public");

const assets = [
  {
    source: path.join(pkgRoot, "legacy", "build", "pdf.worker.min.mjs"),
    target: path.join(publicDir, "pdf.worker.min.mjs"),
    type: "file",
  },
  {
    source: path.join(pkgRoot, "standard_fonts"),
    target: path.join(publicDir, "standard_fonts"),
    type: "dir",
  },
  {
    source: path.join(pkgRoot, "cmaps"),
    target: path.join(publicDir, "cmaps"),
    type: "dir",
  },
  {
    source: path.join(pkgRoot, "wasm"),
    target: path.join(publicDir, "wasm"),
    type: "dir",
  },
  {
    source: path.join(pkgRoot, "iccs"),
    target: path.join(publicDir, "iccs"),
    type: "dir",
  },
];

mkdirSync(publicDir, { recursive: true });

for (const asset of assets) {
  if (!existsSync(asset.source)) {
    console.warn(`pdfjs asset not found: ${asset.source} — run npm install first.`);
    continue;
  }

  if (asset.type === "file") {
    copyFileSync(asset.source, asset.target);
    console.log(`Copied ${path.basename(asset.target)} to public/.`);
    continue;
  }

  cpSync(asset.source, asset.target, { recursive: true });
  console.log(`Copied ${path.basename(asset.target)}/ to public/.`);
}
