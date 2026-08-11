"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DragEvent,
  FormEvent,
  InputHTMLAttributes,
  ReactNode,
  useId,
  useRef,
  useState,
} from "react";
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
import { cn } from "@/lib/utils";

const fieldClass =
  "w-full rounded-xl border border-[#eadbc8]/80 bg-[#fbf7f0]/60 py-2.5 pl-10 pr-3.5 text-sm text-text shadow-sm placeholder:text-[#a89888] transition duration-200 focus:border-primary/40 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10";

function IconField({
  label,
  icon,
  error,
  required,
  ...props
}: {
  label: string;
  icon: ReactNode;
  error?: string;
  required?: boolean;
} & InputHTMLAttributes<HTMLInputElement>) {
  const inputId = useId();

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-sm font-medium text-[#3c2a21]">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8B6F52]">
          {icon}
        </span>
        <input id={inputId} className={cn(fieldClass, error && "border-red-400 focus:ring-red-100")} {...props} />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

function BookIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="8" r="4" />
    </svg>
  );
}

function PdfFileIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 2v6h6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 12h4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 16h4" />
    </svg>
  );
}

function UploadPdfIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V8" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m8 12 4-4 4 4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    </svg>
  );
}

function CoverImageIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 15l-5-5L5 21" />
    </svg>
  );
}

function PdfDropZone({
  file,
  error,
  onChange,
}: {
  file: File | null;
  error?: string;
  onChange: (file: File | null) => void;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function pickPdf(next: File | null) {
    if (!next) {
      onChange(null);
      return;
    }
    if (next.type !== "application/pdf") {
      onChange(null);
      return;
    }
    onChange(next);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    pickPdf(e.dataTransfer.files?.[0] ?? null);
  }

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-sm font-medium text-[#3c2a21]">
        PDF file <span className="text-red-600">*</span>
      </label>

      {file ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-primary/25 bg-[#fff8f1] px-4 py-3 shadow-sm">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <PdfFileIcon />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[#3c2a21]">{file.name}</p>
              <p className="flex items-center gap-1 text-xs text-green-700">
                <span aria-hidden>✓</span> Ready to upload
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              onChange(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-[#8a7968] transition hover:bg-white hover:text-red-600"
          >
            Remove
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            "rounded-2xl border-2 border-dashed px-6 py-8 text-center transition duration-200",
            dragging
              ? "border-primary bg-[#fff8f1] shadow-inner"
              : "border-[#d4c4ae] bg-[#fffdf9] hover:border-primary/35 hover:bg-[#fff8f1]",
            error && "border-red-300 bg-red-50/40",
          )}
        >
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UploadPdfIcon />
          </span>
          <p className="mt-4 text-sm font-medium text-[#3c2a21]">Drag &amp; drop PDF here</p>
          <p className="mt-1 text-xs text-[#8a7968]">or</p>
          <label
            htmlFor={inputId}
            className="mt-3 inline-flex cursor-pointer items-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-primary-light"
          >
            Choose file
          </label>
          <p className="mt-3 text-xs text-[#8a7968]">PDF up to 50 MB</p>
        </div>
      )}

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="application/pdf"
        className="sr-only"
        onChange={(e) => pickPdf(e.target.files?.[0] ?? null)}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

function CoverField({
  file,
  onChange,
}: {
  file: File | null;
  onChange: (file: File | null) => void;
}) {
  const inputId = useId();

  return (
    <div className="space-y-1.5 rounded-xl border border-[#eadbc8]/45 bg-[#faf6f0]/50 p-4">
      <label htmlFor={inputId} className="block text-sm font-medium text-[#8a7968]">
        Cover image <span className="font-normal">(optional)</span>
      </label>
      <p className="text-xs text-[#a89888]">Leave empty to use the first page of your PDF.</p>

      {file ? (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-[#eadbc8]/60 bg-white/70 px-3 py-2">
          <p className="truncate text-sm text-[#5b4028]">{file.name}</p>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-xs font-medium text-[#8a7968] hover:text-red-600"
          >
            Remove
          </button>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#eadbc8]/70 bg-white/60 px-3 py-2 text-sm font-medium text-[#8a7968] transition hover:border-[#d4c4ae] hover:bg-white"
        >
          <CoverImageIcon />
          Choose cover
        </label>
      )}

      <input
        id={inputId}
        type="file"
        accept="image/*"
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
  const [titleError, setTitleError] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTitleError(null);
    setPdfError(null);
    setFormError(null);

    let hasError = false;
    if (!title.trim()) {
      setTitleError("Title is required.");
      hasError = true;
    }
    if (!pdfFile) {
      setPdfError("Please select a PDF file.");
      hasError = true;
    } else if (pdfFile.type !== "application/pdf") {
      setPdfError("Only PDF files are supported.");
      hasError = true;
    } else if (pdfFile.size > MAX_PDF_SIZE_BYTES) {
      setPdfError("PDF must be 50 MB or smaller.");
      hasError = true;
    }
    if (hasError) return;

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
        setFormError("You must be logged in. Try logging out and back in.");
        setLoading(false);
        return;
      }

      const bookId = crypto.randomUUID();
      const pdfPath = `${user.id}/${bookId}.pdf`;

      setProgress("Analyzing PDF...");
      setUploadPercent(20);
      const { totalPages, coverBlob: generatedCoverBlob } =
        await extractPdfMetadata(pdfFile!);

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
        pdfFile!,
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
        read_count: 0,
        pages_visited: [],
        last_opened_at: null,
      });

      if (insertError) {
        throw new Error(insertError.message || "Could not save book to your shelf.");
      }

      setToast("Book added successfully.");
      setProgress(null);
      setUploadPercent(null);
      window.setTimeout(() => {
        router.push(`/book/${bookId}`);
        router.refresh();
      }, 1600);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Upload failed.");
      setLoading(false);
      setProgress(null);
      setUploadPercent(null);
    }
  }

  return (
    <>
      <div className="mx-auto flex w-full max-w-[680px] justify-center px-1 py-2 sm:py-6">
        <div className="w-full rounded-3xl border border-[#eadbc8]/70 bg-white p-6 shadow-[0_12px_40px_rgba(31,22,16,0.1)] sm:p-10">
          <Link
            href="/shelf"
            className="-ml-1 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-[#8a7968] transition duration-200 hover:bg-[#fbf7f0] hover:text-primary"
          >
            <span aria-hidden className="text-base">←</span>
            Back to shelf
          </Link>

          <h1 className="mt-4 font-serif text-3xl font-semibold text-[#3c2a21] sm:text-4xl">
            Add a book
          </h1>
          <p className="mt-2 text-[#8a7968]">Upload a PDF up to 50 MB.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5 pb-5">
            <IconField
              label="Title"
              required
              icon={<BookIcon />}
              placeholder="e.g. Atomic Habits"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (titleError) setTitleError(null);
              }}
              error={titleError ?? undefined}
            />
            <IconField
              label="Author"
              icon={<UserIcon />}
              placeholder="e.g. James Clear"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
            />
            <PdfDropZone
              file={pdfFile}
              error={pdfError ?? undefined}
              onChange={(file) => {
                setPdfFile(file);
                if (pdfError) setPdfError(null);
              }}
            />
            <CoverField file={coverFile} onChange={setCoverFile} />

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
            {formError && (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</p>
            )}

            <Button type="submit" className="mt-1 h-11 w-full gap-2" disabled={loading}>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
              </svg>
              {loading ? "Uploading..." : "Add to shelf"}
            </Button>
          </form>
        </div>
      </div>

      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-xl border border-green-200 bg-white px-5 py-3 text-sm font-medium text-green-800 shadow-[0_12px_32px_rgba(31,22,16,0.12)]"
        >
          <span aria-hidden className="text-green-600">✓</span>
          {toast}
        </div>
      )}
    </>
  );
}
