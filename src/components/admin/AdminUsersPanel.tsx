"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

type AdminUserRow = {
  id: string;
  email: string;
  name: string;
  isOnline: boolean;
  lastSeenAt: string | null;
  lastSignInAt: string | null;
  createdAt: string;
  isAdmin: boolean;
};

function formatDate(value: string | null) {
  if (!value) return "Never";
  return new Date(value).toLocaleString();
}

export function AdminUsersPanel() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadUsers = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;
    if (!silent) setRefreshing(true);

    try {
      const response = await fetch("/api/admin/users", { credentials: "same-origin" });
      const body = (await response.json()) as { users?: AdminUserRow[]; error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "Could not load users.");
      }
      setUsers(body.users ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load users.");
    } finally {
      setInitialLoading(false);
      if (!silent) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers({ silent: true });
    const timer = setInterval(() => void loadUsers({ silent: true }), 15_000);
    return () => clearInterval(timer);
  }, [loadUsers]);

  async function handleSignOut(userId: string) {
    if (!confirm("Sign this user out from all devices?")) return;

    setBusyId(userId);
    setError(null);
    try {
      const response = await fetch(`/api/admin/users/${userId}/sign-out`, {
        method: "POST",
        credentials: "same-origin",
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "Sign out failed.");
      }
      await loadUsers({ silent: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign out failed.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleUnregister(userId: string, email: string) {
    if (
      !confirm(
        `Permanently delete ${email}? This removes their shelf, books, notes, and highlights.`,
      )
    ) {
      return;
    }

    setBusyId(userId);
    setError(null);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "Delete failed.");
      }
      setUsers((current) => current.filter((user) => user.id !== userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="mt-10">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-text">Users</h2>
        </div>
        <Button
          variant="secondary"
          size="sm"
          disabled={refreshing}
          onClick={() => void loadUsers()}
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {error && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      <div className="glass-panel overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-white/60 bg-background-elevated/80 text-text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Last sign-in</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {initialLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-text-muted">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-text-muted">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-b border-white/40 last:border-0">
                    <td className="px-4 py-3 font-medium text-text">
                      {user.name}
                      {user.isAdmin && (
                        <span className="ml-2 rounded-full bg-accent/15 px-2 py-0.5 text-xs text-primary">
                          Admin
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-text-muted">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2">
                        <span
                          className={
                            user.isOnline
                              ? "h-2 w-2 rounded-full bg-emerald-500"
                              : "h-2 w-2 rounded-full bg-stone-400"
                          }
                          aria-hidden
                        />
                        <span
                          className={
                            user.isOnline
                              ? "text-xs font-medium text-emerald-800"
                              : "text-xs font-medium text-stone-600"
                          }
                        >
                          {user.isOnline ? "Online" : "Offline"}
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-muted">
                      {formatDate(user.lastSignInAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={busyId === user.id}
                          onClick={() => void handleSignOut(user.id)}
                        >
                          Sign out
                        </Button>
                        {!user.isAdmin && (
                          <Button
                            variant="danger"
                            size="sm"
                            disabled={busyId === user.id}
                            onClick={() => void handleUnregister(user.id, user.email)}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
