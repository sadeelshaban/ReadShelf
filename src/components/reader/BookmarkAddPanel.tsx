"use client";

import { BOOKMARK_COLORS, normalizeBookmarkLabel, type BookmarkColorId } from "@/lib/reader/bookmarks";
import { cn } from "@/lib/utils";

type BookmarkAddPanelProps = {
  page: number;
  color: BookmarkColorId;
  label: string;
  onColorChange: (color: BookmarkColorId) => void;
  onLabelChange: (label: string) => void;
  onAdd: () => void;
  onClose: () => void;
};

export function BookmarkAddPanel({
  page,
  color,
  label,
  onColorChange,
  onLabelChange,
  onAdd,
  onClose,
}: BookmarkAddPanelProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center px-6">
      <div
        className="pointer-events-auto w-full max-w-xs rounded-2xl border border-white/15 bg-[#1f1f1f]/96 p-5 shadow-2xl"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">
          Add bookmark
        </p>
        <p className="mt-1 text-sm text-white/70">Page {page}</p>

        <div className="mt-4">
          <p className="mb-2 text-xs font-medium text-white/55">Color</p>
          <div className="flex gap-3">
            {BOOKMARK_COLORS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                title={preset.name}
                aria-label={preset.name}
                aria-pressed={color === preset.id}
                onClick={() => onColorChange(preset.id)}
                className={cn(
                  "h-9 w-9 rounded-full border-2 transition hover:scale-105",
                  color === preset.id ? "border-white ring-2 ring-[#0a84ff]" : "border-white/25",
                )}
                style={{ backgroundColor: preset.value }}
              />
            ))}
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-2 block text-xs font-medium text-white/55">
            Label <span className="text-white/35">(optional, one word)</span>
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => onLabelChange(normalizeBookmarkLabel(e.target.value))}
            placeholder="Exam"
            className="w-full rounded-lg border border-white/15 bg-black/35 px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-[#0a84ff] focus:outline-none"
          />
        </div>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onAdd}
            className="flex-1 rounded-xl bg-[#6f4528] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#8a5a36]"
          >
            Add bookmark
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/8"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

type BookmarkDeleteConfirmProps = {
  label: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function BookmarkDeleteConfirm({
  label,
  onConfirm,
  onCancel,
}: BookmarkDeleteConfirmProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center bg-black/45 px-6 backdrop-blur-[2px]">
      <div
        className="pointer-events-auto w-full max-w-sm rounded-2xl border border-white/15 bg-[#1f1f1f]/96 p-6 text-center shadow-2xl"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <p className="font-serif text-xl font-semibold text-white">Delete this bookmark?</p>
        <p className="mt-2 text-sm text-white/65">{label}</p>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-[#b33a3a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#c94a4a]"
          >
            Yes
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-medium text-white/80 transition hover:bg-white/8"
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
}
