"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

type FeedbackRow = {
  id: string;
  userEmail: string;
  categoryLabel: string;
  message: string;
  createdAt: string;
};

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

export function AdminFeedbackPanel({ embedded = false }: { embedded?: boolean }) {
  const [feedback, setFeedback] = useState<FeedbackRow[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFeedback = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;
    if (!silent) setRefreshing(true);

    try {
      const response = await fetch("/api/admin/feedback", { credentials: "same-origin" });
      const body = (await response.json()) as { feedback?: FeedbackRow[]; error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "Could not load feedback.");
      }
      setFeedback(body.feedback ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load feedback.");
    } finally {
      setInitialLoading(false);
      if (!silent) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadFeedback({ silent: true });
  }, [loadFeedback]);

  return (
    <section id="feedback" className={embedded ? undefined : "mt-12 scroll-mt-24"}>
      {!embedded && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-[2.125rem] font-semibold tracking-tight text-text">
              Feedback
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              Private user notes with the submitter&apos;s email for follow-up.
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            disabled={refreshing}
            onClick={() => void loadFeedback()}
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      )}

      {embedded && (
        <div className="mb-4 flex justify-end">
          <Button
            variant="secondary"
            size="sm"
            disabled={refreshing}
            onClick={() => void loadFeedback()}
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      )}

      {error && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      <div className="glass-panel rounded-2xl">
        {initialLoading ? (
          <p className="px-4 py-8 text-center text-sm text-text-muted">Loading feedback...</p>
        ) : feedback.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-text-muted">No feedback yet.</p>
        ) : (
          <ul className="divide-y divide-white/40">
            {feedback.map((item) => (
              <li key={item.id} className="px-4 py-4 sm:px-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-text">{item.userEmail}</p>
                    <p className="mt-1 text-xs text-text-muted">
                      {item.categoryLabel} · {formatDate(item.createdAt)}
                    </p>
                  </div>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-text/90">
                  {item.message}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
