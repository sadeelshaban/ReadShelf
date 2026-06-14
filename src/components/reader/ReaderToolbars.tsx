"use client";

import type { ReaderTool } from "@/types";
import {
  HIGHLIGHT_PRESETS,
  MAX_NOTE_FONT_SIZE,
  MIN_NOTE_FONT_SIZE,
  NOTE_TEXT_COLORS,
} from "@/lib/reader/constants";
import { cn } from "@/lib/utils";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  CursorIcon,
  HighlighterIcon,
  NoteIcon,
  PenIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "@/components/reader/ReaderIcons";

type ToolButtonProps = {
  active: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
};

function ToolButton({ active, label, onClick, children }: ToolButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      data-active={active}
      onClick={onClick}
      className="reader-tool-btn flex h-9 w-9 items-center justify-center rounded-lg"
    >
      {children}
    </button>
  );
}

type SideButtonProps = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
};

function SideButton({ label, onClick, disabled, children }: SideButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="reader-tool-btn flex h-9 w-9 items-center justify-center rounded-lg disabled:cursor-not-allowed disabled:opacity-35"
    >
      {children}
    </button>
  );
}

type LeftToolbarProps = {
  tool: ReaderTool;
  onSelectTool: (tool: ReaderTool) => void;
  highlightColor: string;
  recentColors: string[];
  onPickHighlightColor: (color: string) => void;
  onCommitHighlightColor: (color: string) => void;
  onHighlightColorChange: (color: string) => void;
  noteTextColor: string;
  noteFontSize: number;
  editingNote: boolean;
  onPickNoteColor: (color: string) => void;
  onAdjustNoteFontSize: (delta: number) => void;
};

export function LeftToolbar({
  tool,
  onSelectTool,
  highlightColor,
  recentColors,
  onPickHighlightColor,
  onCommitHighlightColor,
  onHighlightColorChange,
  noteTextColor,
  noteFontSize,
  editingNote,
  onPickNoteColor,
  onAdjustNoteFontSize,
}: LeftToolbarProps) {
  const showDrawColors = tool === "highlight" || tool === "pen";
  const showNoteColors = tool === "note" || editingNote;

  return (
    <aside
      id="left-toolbar"
      className="reader-toolbar flex w-[52px] shrink-0 flex-col items-center gap-0.5 rounded-xl py-2.5"
    >
      <ToolButton active={tool === "read"} label="Select" onClick={() => onSelectTool("read")}>
        <CursorIcon />
      </ToolButton>
      <ToolButton
        active={tool === "highlight"}
        label="Highlighter"
        onClick={() => onSelectTool("highlight")}
      >
        <HighlighterIcon />
      </ToolButton>
      <ToolButton active={tool === "pen"} label="Pen" onClick={() => onSelectTool("pen")}>
        <PenIcon />
      </ToolButton>
      <ToolButton active={tool === "note"} label="Note" onClick={() => onSelectTool("note")}>
        <NoteIcon />
      </ToolButton>

      {showDrawColors && (
        <div className="mt-2 flex flex-col items-center gap-1.5 border-t border-soft-gray/20 pt-2">
          {HIGHLIGHT_PRESETS.slice(0, 5).map((preset) => (
            <button
              key={preset.name}
              type="button"
              title={preset.name}
              className={cn(
                "h-4 w-4 rounded-full border transition hover:scale-110",
                highlightColor.toLowerCase() === preset.value.toLowerCase()
                  ? "border-primary ring-2 ring-primary/25"
                  : "border-soft-gray/35",
              )}
              style={{ backgroundColor: preset.value }}
              onClick={() => onPickHighlightColor(preset.value)}
            />
          ))}
          {recentColors.slice(0, 2).map((color, index) => (
            <button
              key={`${index}-${color}`}
              type="button"
              title="Recent color"
              className={cn(
                "h-4 w-4 rounded-full border transition hover:scale-110",
                highlightColor.toLowerCase() === color.toLowerCase()
                  ? "border-primary ring-2 ring-primary/25"
                  : "border-soft-gray/35",
              )}
              style={{ backgroundColor: color }}
              onClick={() => onPickHighlightColor(color)}
            />
          ))}
          <label
            title="Custom color"
            className="relative flex h-4 w-4 cursor-pointer items-center justify-center rounded-full border border-dashed border-soft-gray/45 bg-white/60"
          >
            <span className="pointer-events-none text-[8px] text-text/50">+</span>
            <input
              type="color"
              value={highlightColor}
              onChange={(e) => onHighlightColorChange(e.target.value)}
              onBlur={(e) => onCommitHighlightColor(e.target.value)}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
          </label>
        </div>
      )}

      {showNoteColors && (
        <div
          id="note-toolbar"
          className="mt-2 flex flex-col items-center gap-1.5 border-t border-soft-gray/20 pt-2"
          onMouseDown={(e) => e.preventDefault()}
        >
          {NOTE_TEXT_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              title={c.name}
              className={cn(
                "h-4 w-4 rounded-full border transition hover:scale-110",
                noteTextColor === c.value
                  ? "border-primary ring-2 ring-primary/25"
                  : "border-soft-gray/35",
              )}
              style={{ backgroundColor: c.css }}
              onClick={() => onPickNoteColor(c.value)}
            />
          ))}
          <button
            type="button"
            title="Smaller text"
            className="reader-tool-btn flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-medium"
            onClick={() => onAdjustNoteFontSize(-2)}
            disabled={noteFontSize <= MIN_NOTE_FONT_SIZE}
          >
            A−
          </button>
          <span className="text-[10px] tabular-nums text-text/45">{noteFontSize}</span>
          <button
            type="button"
            title="Larger text"
            className="reader-tool-btn flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-medium"
            onClick={() => onAdjustNoteFontSize(2)}
            disabled={noteFontSize >= MAX_NOTE_FONT_SIZE}
          >
            A+
          </button>
        </div>
      )}
    </aside>
  );
}

type RightToolbarProps = {
  page: number;
  maxPage: number;
  zoomPercent: number;
  onPageChange: (page: number) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  prevDisabled: boolean;
  nextDisabled: boolean;
};

export function RightToolbar({
  page,
  maxPage,
  zoomPercent,
  onPageChange,
  onPrevPage,
  onNextPage,
  onZoomIn,
  onZoomOut,
  prevDisabled,
  nextDisabled,
}: RightToolbarProps) {
  return (
    <aside
      id="right-toolbar"
      className="reader-toolbar flex w-[52px] shrink-0 flex-col items-center gap-2 rounded-xl py-2.5"
    >
      <form
        className="flex flex-col items-center gap-0.5"
        onSubmit={(e) => {
          e.preventDefault();
          const input = e.currentTarget.elements.namedItem("page") as HTMLInputElement;
          const value = Number.parseInt(input.value, 10);
          if (Number.isFinite(value)) onPageChange(value);
        }}
      >
        <input
          name="page"
          type="number"
          min={1}
          max={maxPage}
          defaultValue={page}
          key={page}
          title="Page number"
          className="w-10 rounded-lg border border-soft-gray/25 bg-white/75 px-1 py-1 text-center text-xs tabular-nums text-text shadow-sm"
        />
        <span className="text-[10px] tabular-nums text-text/45">/ {maxPage}</span>
      </form>

      <div
        className="rounded-lg border border-soft-gray/25 bg-white/75 px-1.5 py-1 text-[11px] tabular-nums text-text/70 shadow-sm"
        title="Zoom level"
      >
        {zoomPercent}%
      </div>

      <div className="mt-0.5 flex flex-col items-center gap-0.5 border-t border-soft-gray/20 pt-2">
        <SideButton label="Previous page" disabled={prevDisabled} onClick={onPrevPage}>
          <ChevronUpIcon />
        </SideButton>
        <SideButton label="Next page" disabled={nextDisabled} onClick={onNextPage}>
          <ChevronDownIcon />
        </SideButton>
      </div>

      <div className="flex flex-col items-center gap-0.5 border-t border-soft-gray/20 pt-2">
        <SideButton label="Zoom in" onClick={onZoomIn}>
          <ZoomInIcon />
        </SideButton>
        <SideButton label="Zoom out" onClick={onZoomOut}>
          <ZoomOutIcon />
        </SideButton>
      </div>
    </aside>
  );
}
