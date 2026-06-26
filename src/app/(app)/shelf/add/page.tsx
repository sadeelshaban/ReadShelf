"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useId, useState } from "react";
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

function FileField({
  label,
  accept,
  required,
  optional,
  fileName,
  onChange,
}: {
  label: string;
  accept: string;
  required?: boolean;
  optional?: boolean;
  fileName: string | null;
  onChange: (file: File | null) => void;
}) {
  const inputId = useId();

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="block text-sm font-medium text-[#3c2a21]">
        {label}
        {optional && (
          <span className="ml-1 font-normal text-[#8a7968]">(optional)</span>
        )}
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <label
          htmlFor={inputId}
          className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-primary-light"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0 4-4m-4 4-4-4M4 21h16" />
          </svg>
          Choose file
        </label>
        <span className="text-sm text-[#8a7968]">{fileName ?? "No file chosen"}</span>
      </div>
      <input
        id={inputId}
        type="file"
        accept={accept}
        required={required}
        className="sr-only"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
    </div>
  );
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
        throw new Error("Could not generate a cover from the first page of this PDF.");
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
    <div className="mx-auto flex max-w-xl justify-center py-4 sm:py-8">
      <div className="w-full rounded-3xl border border-[#eadbc8]/70 bg-white p-8 shadow-sm sm:p-10">
        <Link
          href="/shelf"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#8a7968] transition hover:text-primary"
        >
          <span aria-hidden>←</span> Back to shelf
        </Link>

        <h1 className="mt-6 font-serif text-3xl font-semibold text-[#3c2a21] sm:text-4xl">
          Add a book
        </h1>
        <p className="mt-2 text-[#8a7968]">Upload a PDF up to 50 MB.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <Input
            label="Title"
            required
            placeholder="Enter book title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border-[#eadbc8]/80 bg-[#fbf7f0]/60 focus:bg-white"
          />
          <Input
            label="Author"
            placeholder="Enter author name"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="border-[#eadbc8]/80 bg-[#fbf7f0]/60 focus:bg-white"
          />
          <FileField
            label="PDF file"
            accept="application/pdf"
            required
            fileName={pdfFile?.name ?? null}
            onChange={setPdfFile}
          />
          <FileField
            label="Cover image"
            accept="image/*"
            optional
            fileName={coverFile?.name ?? null}
            onChange={setCoverFile}
          />

          {progress && (
            <div className="space-y-2 rounded-xl bg-[#fbf7f0] px-4 py-3">
              <p className="text-sm font-medium text-primary">{progress}</p>
              {uploadPercent !== null && (
                <div className="h-2 overflow-hidden rounded-full bg-white">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${uploadPercent}%` }}
                  />
                </div>
              )}
            </div>
          )}
          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          )}

          <Button type="submit" className="mt-2 w-full gap-2 py-3" disabled={loading}>
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
            </svg>
            {loading ? "Uploading..." : "Add to shelf"}
          </Button>
        </form>
      </div>
    </div>
  );
}
