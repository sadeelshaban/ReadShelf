"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  extractPdfMetadata,
  MAX_PDF_SIZE_BYTES,
} from "@/lib/pdf";
import {
  resetUploadPlan,
  uploadBookFileViaApi,
} from "@/lib/storage/client-upload";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function AddBookPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!pdfFile) {
      setError("Please select a PDF file.");
      return;
    }

    if (pdfFile.type !== "application/pdf") {
      setError("Only PDF files are supported.");
      return;
    }

    if (pdfFile.size > MAX_PDF_SIZE_BYTES) {
      setError("PDF must be 50 MB or smaller.");
      return;
    }

    setLoading(true);
    setProgress("Preparing upload...");
    setUploadPercent(5);
    resetUploadPlan();

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("You must be logged in.");
        setLoading(false);
        return;
      }

      const bookId = crypto.randomUUID();
      const pdfPath = `${user.id}/${bookId}.pdf`;

      setProgress("Analyzing PDF...");
      setUploadPercent(20);
      const { totalPages, coverBlob: generatedCoverBlob } =
        await extractPdfMetadata(pdfFile);

      const coverPath = `${user.id}/${bookId}-cover.jpg`;
      const coverUploadBody = coverFile ?? generatedCoverBlob;
      const coverContentType = coverFile?.type || "image/jpeg";
      const uploadContext = {
        bookId,
        pdfPath,
        coverPath,
        coverContentType,
      };

      setProgress("Uploading PDF...");
      setUploadPercent(45);
      await uploadBookFileViaApi(
        pdfFile,
        pdfPath,
        "pdf",
        "application/pdf",
        uploadContext,
      );

      setProgress(coverFile ? "Uploading cover..." : "Using first page as cover...");
      setUploadPercent(70);
      await uploadBookFileViaApi(
        coverUploadBody,
        coverPath,
        "cover",
        coverContentType,
        uploadContext,
      );

      setProgress("Saving book...");
      setUploadPercent(90);
      const { error: insertError } = await supabase.from("books").insert({
        id: bookId,
        user_id: user.id,
        title: title.trim(),
        author: author.trim(),
        category: null,
        pdf_path: pdfPath,
        cover_path: coverPath,
        total_pages: totalPages,
        last_page: 1,
        progress_percent: 0,
        last_opened_at: null,
      });

      if (insertError) throw insertError;

      router.push(`/book/${bookId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
      setLoading(false);
      setProgress(null);
      setUploadPercent(null);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <Link href="/shelf" className="text-sm text-primary hover:underline">
        ← Back to shelf
      </Link>
      <h1 className="mt-4 font-serif text-3xl font-semibold text-text">
        Add a book
      </h1>
      <p className="mt-2 text-text/70">Upload a PDF up to 50 MB.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <Input
          label="Title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Input
          label="Author"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
        />
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-text">PDF file</label>
          <input
            type="file"
            accept="application/pdf"
            required
            onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-text file:mr-4 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-primary/90"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-text">
            Cover image (optional)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-text file:mr-4 file:rounded-lg file:border-0 file:bg-card file:px-4 file:py-2 file:text-sm file:font-medium file:text-text file:ring-1 file:ring-soft-gray/50"
          />
        </div>

        {progress && (
          <div className="space-y-2">
            <p className="text-sm text-primary">{progress}</p>
            {uploadPercent !== null && (
              <div className="h-2 overflow-hidden rounded-full bg-background">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-300"
                  style={{ width: `${uploadPercent}%` }}
                />
              </div>
            )}
          </div>
        )}
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Uploading..." : "Add to shelf"}
        </Button>
      </form>
    </div>
  );
}
