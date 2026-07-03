/**
 * One-time migration: copy objects from Supabase Storage to Cloudflare R2.
 * Requires R2_* and SUPABASE_SERVICE_ROLE_KEY in .env.local.
 *
 * Usage: npm run migrate:supabase-to-r2
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

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

function getR2Client() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 credentials missing from .env.local");
  }
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

function guessContentType(path, bucket) {
  if (bucket === "book-pdfs" || path.endsWith(".pdf")) return "application/pdf";
  if (path.endsWith(".png")) return "image/png";
  if (path.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

function mapSupabaseToR2Key(bucket, path) {
  if (bucket === "book-pdfs") return `pdfs/${path}`;
  if (bucket === "book-covers") return `covers/${path}`;
  return null;
}

async function main() {
  loadEnvFile();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const r2Bucket = process.env.R2_BUCKET_NAME;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local.",
    );
  }
  if (!r2Bucket) throw new Error("R2_BUCKET_NAME missing");

  const r2 = getR2Client();
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log(`Migrating Supabase Storage → R2 "${r2Bucket}"`);

  const { data: books, error } = await supabase
    .from("books")
    .select("pdf_path, cover_path");

  if (error) {
    throw new Error(error.message);
  }

  const tasks = [];
  for (const book of books ?? []) {
    if (book.pdf_path) {
      tasks.push({ bucket: "book-pdfs", path: book.pdf_path });
    }
    if (book.cover_path) {
      tasks.push({ bucket: "book-covers", path: book.cover_path });
    }
  }

  let migrated = 0;
  let skipped = 0;

  for (const task of tasks) {
    const key = mapSupabaseToR2Key(task.bucket, task.path);
    if (!key) {
      skipped += 1;
      continue;
    }

    const { data, error: downloadError } = await supabase.storage
      .from(task.bucket)
      .download(task.path);

    if (downloadError || !data) {
      console.log(`skip (missing): ${task.bucket}/${task.path}`);
      skipped += 1;
      continue;
    }

    const buffer = Buffer.from(await data.arrayBuffer());
    const contentType = guessContentType(task.path, task.bucket);

    await r2.send(
      new PutObjectCommand({
        Bucket: r2Bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );

    console.log(`migrated: ${key} (${buffer.length} bytes)`);
    migrated += 1;
  }

  console.log(`\nDone. Migrated: ${migrated}, skipped: ${skipped}`);
  console.log("Set STORAGE_PROVIDER=r2 in .env.local and redeploy.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
