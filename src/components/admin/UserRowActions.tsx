"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
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

type MenuPosition = {
  top: number;
  left: number;
};

function ActionsMenu({
  menuId,
  menuRef,
  position,
  isAdmin,
  busy,
  onClose,
  onStorageNotice,
  onSignOut,
  onDelete,
}: {
  menuId: string;
  menuRef: RefObject<HTMLDivElement | null>;
  position: MenuPosition;
  isAdmin: boolean;
  busy: boolean;
  onClose: () => void;
  onStorageNotice: () => void;
  onSignOut: () => void;
  onDelete: () => void;
}) {
  return createPortal(
    <div
      ref={menuRef}
      id={menuId}
      role="menu"
      style={{
        position: "fixed",
        top: position.top,
        left: position.left,
        zIndex: 50,
      }}
      className="min-w-[11.5rem] overflow-hidden rounded-xl border border-[#eadbc8]/80 bg-white py-1 shadow-[0_12px_32px_rgba(31,22,16,0.14)]"
    >
      {!isAdmin && (
        <button
          type="button"
          role="menuitem"
          disabled={busy}
          onClick={() => {
            onClose();
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
          onClose();
          onSignOut();
        }}
        className="block w-full px-4 py-2.5 text-left text-sm text-text transition hover:bg-[#fbf7f0] disabled:opacity-50"
      >
        Sign out
      </button>
      {!isAdmin && (
        <>
          <div className="my-1 border-t border-[#eadbc8]/60" />
          <button
            type="button"
            role="menuitem"
            disabled={busy}
            onClick={() => {
              onClose();
              onDelete();
            }}
            className="block w-full px-4 py-2.5 text-left text-sm font-medium text-[#DC2626] transition hover:bg-red-50 disabled:opacity-50"
          >
            Delete
          </button>
        </>
      )}
    </div>,
    document.body,
  );
}

export function UserRowActions({
  isAdmin,
  busy,
  onStorageNotice,
  onSignOut,
  onDelete,
}: UserRowActionsProps) {
  const menuId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<MenuPosition | null>(null);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const menuHeight = isAdmin ? 52 : 132;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < menuHeight + 12;
    const menuWidth = 184;

    setPosition({
      top: openUp ? rect.top - menuHeight - 6 : rect.bottom + 6,
      left: Math.max(8, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8)),
    });
  }, [open, isAdmin]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    }

    function onEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    function onScroll() {
      setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onEscape);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        disabled={busy}
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#eadbc8]/70 bg-white text-base leading-none text-text-muted shadow-sm transition hover:border-[#d4c4ae] hover:bg-[#fbf7f0] hover:text-text disabled:opacity-50"
      >
        <span aria-hidden>⋯</span>
        <span className="sr-only">User actions</span>
      </button>

      {open && position && (
        <ActionsMenu
          menuId={menuId}
          menuRef={menuRef}
          position={position}
          isAdmin={isAdmin}
          busy={busy}
          onClose={() => setOpen(false)}
          onStorageNotice={onStorageNotice}
          onSignOut={onSignOut}
          onDelete={onDelete}
        />
      )}
    </>
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
      <span
        className={cn(
          "h-2 w-2 shrink-0 rounded-full",
          online ? "bg-emerald-500" : "bg-stone-400",
        )}
        aria-hidden
      />
      {online ? "Online" : "Offline"}
    </span>
  );
}

export { StatusBadge };
