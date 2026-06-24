"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { extractPdfMetadata } from "@/lib/pdf";
import {
  resetUploadPlan,
  uploadBookFileViaApi,
} from "@/lib/storage/client-upload";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.round(size / 1024)} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

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
  const bucketMissing = error?.toLowerCase().includes("storage is not fully set up yet");

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

    setLoading(true);
    setProgress("Preparing upload...");
    setUploadPercent(5);
    resetUploadPlan();

    try {
      const supabase = createClient();
      await supabase.auth.refreshSession();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setError("You must be logged in. Try logging out and back in.");
        setLoading(false);
        return;
      }

      const bookId = crypto.randomUUID();
      const pdfPath = `${user.id}/${bookId}.pdf`;

      setProgress("Analyzing PDF...");
      setUploadPercent(20);
      const { totalPages, coverBlob: generatedCoverBlob } =
        await extractPdfMetadata(pdfFile);

      if (!coverFile && (!generatedCoverBlob || generatedCoverBlob.size === 0)) {
        throw new Error("Could not use the first PDF page as a cover.");
      }

      const coverPath = `${user.id}/${bookId}-cover.jpg`;
      const coverUploadBody = coverFile ?? generatedCoverBlob!;
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

      if (insertError) {
        throw new Error(insertError.message || "Could not save book to your shelf.");
      }

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
    <section className="video-hero-panel relative left-1/2 right-1/2 min-h-[calc(100vh-4.5rem)] w-screen -translate-x-1/2 overflow-hidden">
      <video
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
      >
        <source src="/videos/add-book-background.mp4" type="video/mp4" />
      </video>
      <div className="video-hero-overlay absolute inset-0" />
      <div className="video-form-overlay absolute inset-0" />

      <div className="relative mx-auto flex min-h-[calc(100vh-4.5rem)] w-full max-w-7xl flex-col justify-center px-5 py-8 sm:px-8 sm:py-10 lg:px-10">
        <div className="mx-auto w-full max-w-3xl">
          <Link href="/shelf" className="mb-4 inline-flex text-sm text-white/78 hover:text-white hover:underline">
            ← Back to shelf
          </Link>

          <section className="rounded-[2rem] border border-white/18 bg-white/12 p-6 text-white shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-2xl sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/65">
              Library
            </p>
            <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Add a new book
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/78 sm:text-base">
              Upload your PDF, add a title and author, and keep your reading
              progress and annotations attached to the same book.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <Input
                  label="Title"
                  labelClassName="text-white"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Atomic Habits"
                  className="rounded-xl border border-white/90 bg-white/95 text-[#24180f] placeholder:text-[#8a7968] shadow-sm focus:border-[#f0dfc4] focus:bg-white focus:ring-[#f2e3c8]/35"
                />
                <Input
                  label="Author"
                  labelClassName="text-white"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="e.g. James Clear"
                  className="rounded-xl border border-white/90 bg-white/95 text-[#24180f] placeholder:text-[#8a7968] shadow-sm focus:border-[#f0dfc4] focus:bg-white focus:ring-[#f2e3c8]/35"
                />
              </div>

              <div className="grid gap-4">
                <div className="rounded-2xl border border-white/15 bg-black/10 p-4 shadow-sm backdrop-blur-md">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <label className="block text-sm font-semibold text-white">PDF file</label>
                      <p className="text-sm text-white/65">Required.</p>
                    </div>
                    {pdfFile && (
                      <span className="rounded-full bg-white/12 px-3 py-1 text-xs font-medium text-white">
                        {formatFileSize(pdfFile.size)}
                      </span>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="application/pdf"
                    required
                    onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
                    className="mt-4 block w-full text-sm text-white/85 file:mr-4 file:rounded-xl file:border file:border-white/10 file:bg-white/88 file:px-4 file:py-2.5 file:text-sm file:font-medium file:text-primary hover:file:bg-white"
                  />
                  {pdfFile && (
                    <p className="mt-3 truncate text-sm text-white/72">{pdfFile.name}</p>
                  )}
                </div>

                <div className="rounded-2xl border border-white/15 bg-black/10 p-4 shadow-sm backdrop-blur-md">
                  <div>
                    <label className="block text-sm font-semibold text-white">
                      Cover image
                    </label>
                    <p className="text-sm text-white/65">
                      Optional. If you skip this, the first PDF page will be used as the cover.
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
                    className="mt-4 block w-full text-sm text-white/85 file:mr-4 file:rounded-xl file:border file:border-white/10 file:bg-white/88 file:px-4 file:py-2.5 file:text-sm file:font-medium file:text-primary hover:file:bg-white"
                  />
                  {coverFile && (
                    <p className="mt-3 truncate text-sm text-white/72">{coverFile.name}</p>
                  )}
                </div>
              </div>

              {progress && (
                <div className="rounded-2xl border border-white/18 bg-white/10 p-4 backdrop-blur-md">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-white">{progress}</p>
                    {uploadPercent !== null && (
                      <span className="text-xs font-semibold text-white/85">
                        {uploadPercent}%
                      </span>
                    )}
                  </div>
                  {uploadPercent !== null && (
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/18">
                      <div
                        className="h-full rounded-full bg-[#e2c483] transition-all duration-300"
                        style={{ width: `${uploadPercent}%` }}
                      />
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="rounded-2xl border border-[#e5c79d]/30 bg-[#2f241b]/55 px-4 py-3 text-sm text-[#fff4e3] backdrop-blur-md">
                  <p>{error}</p>
                  {bucketMissing && (
                    <p className="mt-2 text-[#f6e4c8]/85">
                      Open Supabase Storage and create two private buckets:
                      `book-pdfs` and `book-covers`.
                    </p>
                  )}
                </div>
              )}

              <div className="border-t border-white/12 pt-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-white/62">
                    Your book stays private to your account.
                  </p>
                  <Button type="submit" className="sm:min-w-44" disabled={loading}>
                    {loading ? "Uploading..." : "Add to shelf"}
                  </Button>
                </div>
              </div>
            </form>
          </section>
        </div>
      </div>
    </section>
  );
}
