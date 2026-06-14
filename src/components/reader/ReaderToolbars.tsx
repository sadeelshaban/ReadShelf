"use client";

import { useEffect, useState } from "react";
import type { ReaderTool } from "@/types";
import {
  HIGHLIGHT_PRESETS,
  MAX_NOTE_FONT_SIZE,
  MIN_NOTE_FONT_SIZE,
  NOTE_TEXT_COLORS,
} from "@/lib/reader/constants";
import { cn } from "@/lib/utils";
import { DraggableToolbar } from "@/components/reader/DraggableToolbar";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  CursorIcon,
  EraserIcon,
  HandIcon,
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
      className="acrobat-tool-btn flex h-9 w-9 items-center justify-center rounded"
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
      className="acrobat-tool-btn flex h-8 w-8 items-center justify-center rounded disabled:cursor-not-allowed disabled:opacity-35"
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
    <DraggableToolbar id="left-toolbar">
      <ToolButton active={tool === "read"} label="Select" onClick={() => onSelectTool("read")}>
        <CursorIcon />
      </ToolButton>
      <ToolButton active={tool === "pan"} label="Pan" onClick={() => onSelectTool("pan")}>
        <HandIcon />
      </ToolButton>
      <ToolButton active={tool === "note"} label="Comment" onClick={() => onSelectTool("note")}>
        <NoteIcon />
      </ToolButton>
      <ToolButton
        active={tool === "highlight"}
        label="Highlighter"
        onClick={() => onSelectTool("highlight")}
      >
        <HighlighterIcon />
      </ToolButton>
      <ToolButton active={tool === "pen"} label="Draw" onClick={() => onSelectTool("pen")}>
        <PenIcon />
      </ToolButton>
      <ToolButton active={tool === "eraser"} label="Eraser" onClick={() => onSelectTool("eraser")}>
        <EraserIcon />
      </ToolButton>

      {showDrawColors && (
        <div className="mt-1.5 flex flex-col items-center gap-1 border-t border-white/10 pt-1.5">
          {HIGHLIGHT_PRESETS.slice(0, 5).map((preset) => (
            <button
              key={preset.name}
              type="button"
              title={preset.name}
              className={cn(
                "h-3.5 w-3.5 rounded-full border transition hover:scale-110",
                highlightColor.toLowerCase() === preset.value.toLowerCase()
                  ? "border-white ring-1 ring-[#0a84ff]"
                  : "border-white/25",
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
                "h-3.5 w-3.5 rounded-full border transition hover:scale-110",
                highlightColor.toLowerCase() === color.toLowerCase()
                  ? "border-white ring-1 ring-[#0a84ff]"
                  : "border-white/25",
              )}
              style={{ backgroundColor: color }}
              onClick={() => onPickHighlightColor(color)}
            />
          ))}
          <label
            title="Custom color"
            className="relative flex h-3.5 w-3.5 cursor-pointer items-center justify-center rounded-full border border-dashed border-white/30"
          >
            <span className="pointer-events-none text-[7px] text-white/60">+</span>
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
          className="mt-1.5 flex flex-col items-center gap-1 border-t border-white/10 pt-1.5"
          onMouseDown={(e) => e.preventDefault()}
        >
          {NOTE_TEXT_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              title={c.name}
              className={cn(
                "h-3.5 w-3.5 rounded-full border transition hover:scale-110",
                noteTextColor === c.value
                  ? "border-white ring-1 ring-[#0a84ff]"
                  : "border-white/25",
              )}
              style={{ backgroundColor: c.css }}
              onClick={() => onPickNoteColor(c.value)}
            />
          ))}
          <button
            type="button"
            title="Smaller text"
            className="acrobat-tool-btn flex h-5 w-5 items-center justify-center rounded text-[9px]"
            onClick={() => onAdjustNoteFontSize(-2)}
            disabled={noteFontSize <= MIN_NOTE_FONT_SIZE}
          >
            A−
          </button>
          <span className="text-[9px] tabular-nums text-white/50">{noteFontSize}</span>
          <button
            type="button"
            title="Larger text"
            className="acrobat-tool-btn flex h-5 w-5 items-center justify-center rounded text-[9px]"
            onClick={() => onAdjustNoteFontSize(2)}
            disabled={noteFontSize >= MAX_NOTE_FONT_SIZE}
          >
            A+
          </button>
        </div>
      )}
    </DraggableToolbar>
  );
}

type PageNumberInputProps = {
  page: number;
  maxPage: number;
  onGoToPage: (page: number) => void;
};

function PageNumberInput({ page, maxPage, onGoToPage }: PageNumberInputProps) {
  const [draft, setDraft] = useState(String(page));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) {
      setDraft(String(page));
    }
  }, [page, focused]);

  function commit() {
    const trimmed = draft.trim();
    if (!trimmed) {
      setDraft(String(page));
      return;
    }

    const parsed = Number.parseInt(trimmed, 10);
    if (Number.isNaN(parsed)) {
      setDraft(String(page));
      return;
    }

    const clamped = Math.min(maxPage, Math.max(1, parsed));
    setDraft(String(clamped));
    onGoToPage(clamped);
  }

  return (
    <div className="flex flex-col items-center gap-0.5">
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={draft}
        onChange={(e) => setDraft(e.target.value.replace(/\D/g, ""))}
        onFocus={(e) => {
          setFocused(true);
          e.target.select();
        }}
        onBlur={() => {
          setFocused(false);
          commit();
        }}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
            e.currentTarget.blur();
          }
          if (e.key === "Escape") {
            setDraft(String(page));
            e.currentTarget.blur();
          }
        }}
        aria-label="Go to page"
        title="Type a page number, then press Enter or click outside"
        className="acrobat-page-input"
      />
      <span className="text-[10px] font-medium tabular-nums text-white/70">/{maxPage}</span>
    </div>
  );
}

type RightToolbarProps = {
  page: number;
  maxPage: number;
  zoomPercent: number;
  onGoToPage: (page: number) => void;
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
  onGoToPage,
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
      className="acrobat-toolbar pointer-events-auto absolute right-3 top-1/2 z-20 flex w-11 -translate-y-1/2 flex-col items-center gap-1.5 rounded py-2.5"
    >
      <div className="flex flex-col items-center gap-0.5 pb-1.5">
        <SideButton label="Previous page" disabled={prevDisabled} onClick={onPrevPage}>
          <ChevronUpIcon />
        </SideButton>
        <PageNumberInput page={page} maxPage={maxPage} onGoToPage={onGoToPage} />
        <SideButton label="Next page" disabled={nextDisabled} onClick={onNextPage}>
          <ChevronDownIcon />
        </SideButton>
      </div>

      <div className="acrobat-zoom-badge border-t border-white/10 pt-1.5" title="Zoom level">
        {zoomPercent}%
      </div>

      <div className="flex flex-col items-center gap-0.5 border-t border-white/10 pt-1.5">
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
