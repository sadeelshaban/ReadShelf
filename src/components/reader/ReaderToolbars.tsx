"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { ReaderTool, ShapeKind } from "@/types";
import {
  HIGHLIGHT_PRESETS,
  MAX_STROKE_WIDTH,
  MAX_NOTE_FONT_SIZE,
  MIN_NOTE_FONT_SIZE,
  MIN_STROKE_WIDTH,
  NOTE_TEXT_COLORS,
} from "@/lib/reader/constants";
import { cn } from "@/lib/utils";
import { DraggableToolbar } from "@/components/reader/DraggableToolbar";
import { READER_TOOL_ICONS, ReaderToolIcon } from "@/components/reader/ReaderToolIcon";
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CursorIcon,
  LineThicknessIcon,
  ShapeArrowIcon,
  ShapeCircleIcon,
  ShapeLineIcon,
  ShapeRectIcon,
  ShapesIcon,
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

type ToolGroupOption = {
  tool: ReaderTool;
  label: string;
  icon: ReactNode;
};

type ToolGroupButtonProps = {
  options: ToolGroupOption[];
  activeTool: ReaderTool;
  onSelectTool: (tool: ReaderTool) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function ToolGroupButton({
  options,
  activeTool,
  onSelectTool,
  open,
  onOpenChange,
}: ToolGroupButtonProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const activeOption =
    options.find((option) => option.tool === activeTool) ?? options[0];
  const isGroupActive = options.some((option) => option.tool === activeTool);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        onOpenChange(false);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [open, onOpenChange]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        title={activeOption.label}
        aria-label={activeOption.label}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-pressed={isGroupActive}
        data-active={isGroupActive}
        onClick={() => onOpenChange(!open)}
        className="acrobat-tool-btn acrobat-tool-group-btn relative flex h-9 w-9 items-center justify-center rounded"
      >
        {activeOption.icon}
      </button>

      {open && (
        <div className="acrobat-tool-flyout" role="menu">
          {options.map((option) => {
            const selected = option.tool === activeTool;
            return (
              <button
                key={option.tool}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                data-active={selected}
                className="acrobat-tool-flyout-item"
                onClick={() => {
                  onSelectTool(option.tool);
                  onOpenChange(false);
                }}
              >
                <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center">
                  {option.icon}
                </span>
                <span className="flex-1 text-left">{option.label}</span>
                {selected && <CheckIcon className="shrink-0 text-[#0a84ff]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

type ThicknessSliderFlyoutProps = {
  value: number;
  onChange: (width: number) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function ThicknessSliderFlyout({
  value,
  onChange,
  open,
  onOpenChange,
}: ThicknessSliderFlyoutProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        onOpenChange(false);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [open, onOpenChange]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        title="Line thickness"
        aria-label="Line thickness"
        aria-expanded={open}
        aria-haspopup="dialog"
        data-active={open}
        onClick={() => onOpenChange(!open)}
        className="acrobat-tool-btn acrobat-tool-group-btn relative flex h-9 w-9 items-center justify-center rounded"
      >
        <LineThicknessIcon />
      </button>

      {open && (
        <div className="acrobat-tool-flyout acrobat-thickness-flyout" role="dialog" aria-label="Line thickness">
          <div className="flex flex-col items-center gap-2 px-3 py-3">
            <span className="text-[10px] tabular-nums text-white/50">{MAX_STROKE_WIDTH}</span>
            <input
              type="range"
              min={MIN_STROKE_WIDTH}
              max={MAX_STROKE_WIDTH}
              step={1}
              value={value}
              onChange={(e) => onChange(Number(e.target.value))}
              className="acrobat-thickness-slider"
              aria-label="Thickness"
            />
            <span className="text-[11px] font-medium tabular-nums text-white/85">{value}px</span>
          </div>
        </div>
      )}
    </div>
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
  onSelectTool: (tool: ReaderTool, options?: { force?: boolean }) => void;
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
  highlightStrokeWidth: number;
  penStrokeWidth: number;
  eraserStrokeWidth: number;
  onHighlightStrokeWidthChange: (width: number) => void;
  onPenStrokeWidthChange: (width: number) => void;
  onEraserStrokeWidthChange: (width: number) => void;
  shapeKind: ShapeKind;
  shapeFilled: boolean;
  onShapeKindChange: (kind: ShapeKind) => void;
  onShapeFilledChange: (filled: boolean) => void;
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
  highlightStrokeWidth,
  penStrokeWidth,
  eraserStrokeWidth,
  onHighlightStrokeWidthChange,
  onPenStrokeWidthChange,
  onEraserStrokeWidthChange,
  shapeKind,
  shapeFilled,
  onShapeKindChange,
  onShapeFilledChange,
}: LeftToolbarProps) {
  const shapesRef = useRef<HTMLDivElement>(null);
  const [openGroup, setOpenGroup] = useState<"thickness" | "eraserThickness" | "shapes" | null>(null);
  const showDrawColors = tool === "highlight" || tool === "pen" || tool === "shape";
  const showEraserControls = tool === "eraser";
  const showNoteColors = tool === "note" || editingNote;

  useEffect(() => {
    if (openGroup !== "shapes") return;

    function handlePointerDown(event: PointerEvent) {
      if (!shapesRef.current?.contains(event.target as Node)) {
        setOpenGroup(null);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [openGroup]);

  return (
    <DraggableToolbar id="left-toolbar">
      <ToolButton active={tool === "read"} label="Select" onClick={() => onSelectTool("read", { force: true })}>
        <CursorIcon />
      </ToolButton>

      <ToolButton
        active={tool === "highlight"}
        label="Highlighter"
        onClick={() => onSelectTool("highlight", { force: true })}
      >
        <ReaderToolIcon
          src={READER_TOOL_ICONS.highlighter}
          alt="Highlighter"
          accentColor={highlightColor}
        />
      </ToolButton>

      <ToolButton
        active={tool === "pen"}
        label="Draw"
        onClick={() => onSelectTool("pen", { force: true })}
      >
        <ReaderToolIcon src={READER_TOOL_ICONS.pen} alt="Pen" accentColor={highlightColor} />
      </ToolButton>

      <ToolButton active={tool === "note"} label="Comment" onClick={() => onSelectTool("note")}>
        <ReaderToolIcon src={READER_TOOL_ICONS.note} alt="Note" />
      </ToolButton>

      <ToolButton active={tool === "eraser"} label="Eraser" onClick={() => onSelectTool("eraser")}>
        <ReaderToolIcon src={READER_TOOL_ICONS.eraser} alt="Eraser" />
      </ToolButton>

      <ToolButton active={tool === "pan"} label="Pan" onClick={() => onSelectTool("pan", { force: true })}>
        <ReaderToolIcon src={READER_TOOL_ICONS.hand} alt="Pan" />
      </ToolButton>

      <div ref={shapesRef} className="relative">
        <button
          type="button"
          title="Shapes"
          aria-label="Shapes"
          aria-expanded={openGroup === "shapes"}
          aria-haspopup="menu"
          data-active={tool === "shape"}
          onClick={() => {
            onSelectTool("shape", { force: true });
            setOpenGroup((current) => (current === "shapes" ? null : "shapes"));
          }}
          className="acrobat-tool-btn acrobat-tool-group-btn relative flex h-9 w-9 items-center justify-center rounded"
        >
          {shapeKind === "rect" ? (
            <ShapeRectIcon />
          ) : shapeKind === "ellipse" ? (
            <ShapeCircleIcon />
          ) : shapeKind === "line" ? (
            <ShapeLineIcon />
          ) : shapeKind === "arrow" ? (
            <ShapeArrowIcon />
          ) : (
            <ShapesIcon />
          )}
        </button>

        {openGroup === "shapes" && (
          <div className="acrobat-tool-flyout min-w-[10.5rem]" role="menu">
            {(
              [
                { kind: "rect" as const, label: "Rectangle", icon: <ShapeRectIcon /> },
                { kind: "ellipse" as const, label: "Circle", icon: <ShapeCircleIcon /> },
                { kind: "line" as const, label: "Line", icon: <ShapeLineIcon /> },
                { kind: "arrow" as const, label: "Arrow", icon: <ShapeArrowIcon /> },
              ] as const
            ).map((option) => {
              const selected = shapeKind === option.kind;
              return (
                <button
                  key={option.kind}
                  type="button"
                  role="menuitemradio"
                  aria-checked={selected}
                  data-active={selected}
                  className="acrobat-tool-flyout-item"
                  onClick={() => {
                    onShapeKindChange(option.kind);
                    onSelectTool("shape", { force: true });
                  }}
                >
                  <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center">
                    {option.icon}
                  </span>
                  <span className="flex-1 text-left">{option.label}</span>
                  {selected && <CheckIcon className="shrink-0 text-[#0a84ff]" />}
                </button>
              );
            })}
            <div className="border-t border-white/10 px-3 py-2">
              <div className="flex items-center justify-between gap-2 text-[11px] text-white/70">
                <span>Fill</span>
                <button
                  type="button"
                  className={cn(
                    "rounded px-2 py-0.5 text-[10px] font-medium transition",
                    shapeFilled
                      ? "bg-[#0a84ff] text-white"
                      : "bg-white/10 text-white/75 hover:bg-white/16",
                  )}
                  onClick={() => onShapeFilledChange(!shapeFilled)}
                >
                  {shapeFilled ? "On" : "Off"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showEraserControls && (
        <div className="mt-1.5 flex flex-col items-center border-t border-white/10 pt-1.5">
          <ThicknessSliderFlyout
            value={eraserStrokeWidth}
            onChange={onEraserStrokeWidthChange}
            open={openGroup === "eraserThickness"}
            onOpenChange={(open) => setOpenGroup(open ? "eraserThickness" : null)}
          />
        </div>
      )}

      {showDrawColors && (
        <div className="mt-1.5 flex flex-col items-center gap-1 border-t border-white/10 pt-1.5">
          {HIGHLIGHT_PRESETS.map((preset) => (
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

          <ThicknessSliderFlyout
            value={
              tool === "pen" || tool === "shape"
                ? penStrokeWidth
                : highlightStrokeWidth
            }
            onChange={
              tool === "pen" || tool === "shape"
                ? onPenStrokeWidthChange
                : onHighlightStrokeWidthChange
            }
            open={openGroup === "thickness"}
            onOpenChange={(open) => setOpenGroup(open ? "thickness" : null)}
          />
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
