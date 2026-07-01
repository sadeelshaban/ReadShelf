"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type UserRowActionsProps = {
  userId: string;
  email: string;
  storageLabel: string;
  isAdmin: boolean;
  busy: boolean;
  onStorageNotice: () => void;
  onSignOut: () => void;
  onDelete: () => void;
};

export function UserRowActions({
  isAdmin,
  busy,
  onStorageNotice,
  onSignOut,
  onDelete,
}: UserRowActionsProps) {
  const menuId = useId();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative inline-flex">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        disabled={busy}
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/70 bg-white/60 text-lg text-text-muted shadow-sm transition hover:bg-white/85 hover:text-text disabled:opacity-50"
      >
        <span aria-hidden>⋮</span>
        <span className="sr-only">User actions</span>
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 top-full z-20 mt-1 min-w-[11rem] overflow-hidden rounded-xl border border-[#eadbc8]/80 bg-white py-1 shadow-[0_12px_32px_rgba(31,22,16,0.12)]"
        >
          {!isAdmin && (
            <button
              type="button"
              role="menuitem"
              disabled={busy}
              onClick={() => {
                setOpen(false);
                onStorageNotice();
              }}
              className="block w-full px-4 py-2.5 text-left text-sm text-text transition hover:bg-[#fbf7f0] disabled:opacity-50"
            >
              Storage notice
            </button>
          )}
          <button
            type="button"
            role="menuitem"
            disabled={busy}
            onClick={() => {
              setOpen(false);
              onSignOut();
            }}
            className="block w-full px-4 py-2.5 text-left text-sm text-text transition hover:bg-[#fbf7f0] disabled:opacity-50"
          >
            Sign out
          </button>
          {!isAdmin && (
            <button
              type="button"
              role="menuitem"
              disabled={busy}
              onClick={() => {
                setOpen(false);
                onDelete();
              }}
              className={cn(
                "block w-full px-4 py-2.5 text-left text-sm text-white transition disabled:opacity-50",
                "bg-[#DC2626] hover:bg-[#B91C1C]",
              )}
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ online }: { online: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1",
        online
          ? "bg-emerald-50 text-emerald-800 ring-emerald-200/80"
          : "bg-stone-100 text-stone-600 ring-stone-200/80",
      )}
    >
      <span aria-hidden>{online ? "🟢" : "⚪"}</span>
      {online ? "Online" : "Offline"}
    </span>
  );
}

export { StatusBadge };
