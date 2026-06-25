/**
 * One-time migration: copy objects from Cloudflare R2 to Supabase Storage.
 * Requires R2_* and SUPABASE_SERVICE_ROLE_KEY in .env.local.
 *
 * Usage: npm run migrate:r2-to-supabase
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
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

async function streamToBuffer(body) {
  if (!body) return Buffer.alloc(0);
  if (body instanceof Uint8Array) return Buffer.from(body);
  const chunks = [];
  for await (const chunk of body) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
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

function mapR2KeyToSupabase(key) {
  if (key.startsWith("pdfs/")) {
    return { bucket: "book-pdfs", path: key.slice("pdfs/".length) };
  }
  if (key.startsWith("covers/")) {
    return { bucket: "book-covers", path: key.slice("covers/".length) };
  }
  return null;
}

function guessContentType(key) {
  if (key.includes(".pdf")) return "application/pdf";
  if (key.endsWith(".png")) return "image/png";
  if (key.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

async function main() {
  loadEnvFile();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const r2Bucket = process.env.R2_BUCKET_NAME;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local.\n" +
        "Add service role key from Supabase Dashboard → Settings → API.",
    );
  }
  if (!r2Bucket) throw new Error("R2_BUCKET_NAME missing");

  const r2 = getR2Client();
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log(`Migrating R2 "${r2Bucket}" → Supabase Storage`);

  let continuationToken;
  let migrated = 0;
  let skipped = 0;

  do {
    const list = await r2.send(
      new ListObjectsV2Command({
        Bucket: r2Bucket,
        ContinuationToken: continuationToken,
      }),
    );

    for (const object of list.Contents ?? []) {
      if (!object.Key) continue;

      const target = mapR2KeyToSupabase(object.Key);
      if (!target) {
        console.log(`skip (unknown prefix): ${object.Key}`);
        skipped += 1;
        continue;
      }

      const { data: existing, error: existsError } = await supabase.storage
        .from(target.bucket)
        .download(target.path);

      if (existing && !existsError) {
        console.log(`skip (exists): ${target.bucket}/${target.path}`);
        skipped += 1;
        continue;
      }

      const response = await r2.send(
        new GetObjectCommand({ Bucket: r2Bucket, Key: object.Key }),
      );
      const buffer = await streamToBuffer(response.Body);
      const contentType = response.ContentType ?? guessContentType(object.Key);

      const { error } = await supabase.storage
        .from(target.bucket)
        .upload(target.path, buffer, { contentType, upsert: true });

      if (error) {
        throw new Error(`Upload failed for ${target.path}: ${error.message}`);
      }

      console.log(`migrated: ${target.bucket}/${target.path} (${buffer.length} bytes)`);
      migrated += 1;
    }

    continuationToken = list.NextContinuationToken;
  } while (continuationToken);

  console.log(`\nDone. Migrated: ${migrated}, skipped: ${skipped}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
