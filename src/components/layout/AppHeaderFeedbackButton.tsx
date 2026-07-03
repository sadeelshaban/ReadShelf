"use client";

import { FormEvent, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/Button";
import { FEEDBACK_CATEGORIES, type FeedbackCategory } from "@/lib/feedback/categories";
import { cn } from "@/lib/utils";

export function AppHeaderFeedbackButton() {
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<FeedbackCategory>("general");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (open) return;
    setError(null);
    setSuccess(false);
    setLoading(false);
  }, [open]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ category, message }),
      });

      const body = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(body.error ?? "Could not send feedback.");
      }

      setMessage("");
      setCategory("general");
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send feedback.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label="Send feedback"
        onClick={() => setOpen(true)}
        className="rounded-xl p-2.5 text-text/70 transition-all hover:bg-background-elevated hover:text-primary hover:shadow-sm"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
          aria-hidden
        >
          <path d="M21 15a4 4 0 0 1-4 4H8l-5 3 1.5-4.5A4 4 0 0 1 4 15V6a4 4 0 0 1 4-4h9a4 4 0 0 1 4 4z" />
        </svg>
      </button>

      {mounted &&
        open &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#24180f]/45 p-4"
            onClick={() => setOpen(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              className="glass-panel max-h-[min(90vh,720px)] w-full max-w-lg overflow-y-auto rounded-3xl p-6 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id={titleId} className="font-serif text-2xl font-semibold text-primary">
                  Share feedback
                </h2>
                <p className="mt-2 text-sm leading-6 text-text-muted">
                  Tell us about design, bugs, feature ideas, or anything else. Your feedback is{" "}
                  <span className="font-medium text-text">totally anonymous</span>.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close feedback"
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 text-text-muted transition hover:bg-background-elevated hover:text-text"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  className="h-5 w-5"
                  aria-hidden
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {success ? (
              <div className="mt-6 rounded-2xl border border-[#d9e8d2] bg-[#f4faf1] px-4 py-5 text-sm text-[#2f4d2a]">
                <p className="font-medium">Thanks, your feedback was sent.</p>
                <p className="mt-1 text-[#45633f]">
                  We read every message. Close this window or send another note.
                </p>
                <Button
                  type="button"
                  className="mt-4"
                  variant="secondary"
                  onClick={() => {
                    setSuccess(false);
                    setOpen(false);
                  }}
                >
                  Close
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="feedback-category" className="block text-xs font-medium text-text-muted/90">
                    Category
                  </label>
                  <select
                    id="feedback-category"
                    value={category}
                    onChange={(event) => setCategory(event.target.value as FeedbackCategory)}
                    className="w-full rounded-xl border border-white/70 bg-white/55 px-3.5 py-2.5 text-sm text-text shadow-sm backdrop-blur-sm focus:border-primary/30 focus:bg-white/80 focus:outline-none focus:ring-4 focus:ring-primary/10"
                  >
                    {FEEDBACK_CATEGORIES.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="feedback-message" className="block text-xs font-medium text-text-muted/90">
                    Your feedback
                  </label>
                  <textarea
                    id="feedback-message"
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    rows={5}
                    required
                    maxLength={5000}
                    placeholder="Design ideas, bugs you hit, features you want, or anything else..."
                    className={cn(
                      "w-full resize-y rounded-xl border border-white/70 bg-white/55 px-3.5 py-2.5 text-sm text-text shadow-sm backdrop-blur-sm placeholder:text-soft-gray focus:border-primary/30 focus:bg-white/80 focus:outline-none focus:ring-4 focus:ring-primary/10",
                      error && "border-red-400",
                    )}
                  />
                </div>

                {error && (
                  <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                  </p>
                )}

                <div className="flex flex-wrap justify-end gap-2 pt-1">
                  <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Sending..." : "Send feedback"}
                  </Button>
                </div>
              </form>
            )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
