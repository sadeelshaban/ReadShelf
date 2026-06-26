/**
 * Create demo user and seed a sample book with highlights and notes.
 * Usage: node scripts/seed-demo-shelf.mjs
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

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

const email = (process.env.NEXT_PUBLIC_DEMO_EMAIL ?? "demo@readshelf.app")
  .trim()
  .toLowerCase();
const password = process.env.DEMO_USER_PASSWORD ?? "ReadShelfDemo2026";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function ensureDemoUser() {
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

  await supabase.from("profiles").upsert({ id: userId, is_admin: false }, { onConflict: "id" });
  return userId;
}

async function buildDemoPdf() {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const totalPages = 8;

  for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
    const page = pdfDoc.addPage([612, 792]);
    page.drawText(`ReadShelf Demo — Page ${pageNumber}`, {
      x: 72,
      y: 700,
      size: 22,
      font,
      color: rgb(0.44, 0.27, 0.16),
    });
    page.drawText("Sample PDF for acquisition walkthroughs.", {
      x: 72,
      y: 660,
      size: 14,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });
    page.drawText(
      "Upload real course PDFs, track progress, add highlights and notes, then export an annotated copy.",
      {
        x: 72,
        y: 620,
        size: 12,
        font,
        maxWidth: 468,
        lineHeight: 16,
        color: rgb(0.35, 0.35, 0.35),
      },
    );
  }

  const bytes = await pdfDoc.save();
  return { pdfBuffer: Buffer.from(bytes), totalPages };
}

// Minimal 1x1 JPEG (beige tone)
const DEMO_COVER_JPEG = Buffer.from(
  "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDAREAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAAA//EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8A0f/Z",
  "base64",
);

async function seedDemoShelf(userId) {
  const { data: existingBooks, error: listError } = await supabase
    .from("books")
    .select("id, title")
    .eq("user_id", userId)
    .eq("title", "ReadShelf Platform Demo");

  if (listError) throw listError;

  if (existingBooks?.length) {
    console.log("Demo shelf already seeded — skipping book creation.");
    return existingBooks[0].id;
  }

  const bookId = randomUUID();
  const pdfPath = `${userId}/${bookId}.pdf`;
  const coverPath = `${userId}/${bookId}-cover.jpg`;
  const { pdfBuffer, totalPages } = await buildDemoPdf();

  const { error: pdfUploadError } = await supabase.storage
    .from("book-pdfs")
    .upload(pdfPath, pdfBuffer, { contentType: "application/pdf", upsert: true });

  if (pdfUploadError) throw pdfUploadError;

  const { error: coverUploadError } = await supabase.storage
    .from("book-covers")
    .upload(coverPath, DEMO_COVER_JPEG, { contentType: "image/jpeg", upsert: true });

  if (coverUploadError) throw coverUploadError;

  const { error: insertError } = await supabase.from("books").insert({
    id: bookId,
    user_id: userId,
    title: "ReadShelf Platform Demo",
    author: "ReadShelf",
    category: null,
    pdf_path: pdfPath,
    cover_path: coverPath,
    total_pages: totalPages,
    last_page: 3,
    progress_percent: 38,
    last_opened_at: new Date().toISOString(),
  });

  if (insertError) throw insertError;

  const { data: highlight, error: highlightError } = await supabase
    .from("highlights")
    .insert({
      book_id: bookId,
      user_id: userId,
      page_number: 2,
      selected_text: "Sample PDF for acquisition walkthroughs.",
      color: "yellow",
    })
    .select("id")
    .single();

  if (highlightError) throw highlightError;

  const { error: noteError } = await supabase.from("notes").insert({
    book_id: bookId,
    user_id: userId,
    page_number: 2,
    note_text: "Demo note: annotations stay attached to each page.",
    highlight_id: highlight.id,
  });

  if (noteError) throw noteError;

  console.log(`Seeded demo book: ${bookId} (${totalPages} pages, 38% progress)`);
  return bookId;
}

const userId = await ensureDemoUser();
await seedDemoShelf(userId);

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://readshelf-rust.vercel.app";

console.log("");
console.log("Demo ready for acquisition walkthrough:");
console.log(`  Email:    ${email}`);
console.log(`  Password: ${password}`);
console.log(`  Login:    ${siteUrl}/login`);
console.log(`  Platform: ${siteUrl}/platform`);
console.log("");
