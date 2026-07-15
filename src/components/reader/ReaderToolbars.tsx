"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { ReaderTool, ShapeKind } from "@/types";
import {
  HIGHLIGHT_PRESETS,
  PEN_PRESETS,
  MAX_STROKE_WIDTH,
  MAX_NOTE_FONT_SIZE,
  MIN_NOTE_FONT_SIZE,
  MIN_STROKE_WIDTH,
} from "@/lib/reader/constants";
import { STICKY_NOTE_COLORS } from "@/lib/reader/sticky-notes";
import { cn } from "@/lib/utils";
import { DraggableToolbar } from "@/components/reader/DraggableToolbar";
import { READER_TOOL_ICONS, ReaderToolIcon } from "@/components/reader/ReaderToolIcon";
import { ReaderTooltip } from "@/components/reader/ReaderTooltip";
import {
  CheckIcon,
  CursorIcon,
  LineThicknessIcon,
  CommentIcon,
  PaletteIcon,
  ShapeArrowIcon,
  ShapeSingleArrowIcon,
  ShapeCircleIcon,
  ShapeLineIcon,
  ShapeRectIcon,
  ShapesIcon,
} from "@/components/reader/ReaderIcons";

type ToolButtonProps = {
  active: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
};

function ToolButton({ active, label, onClick, children }: ToolButtonProps) {
  return (
    <ReaderTooltip label={label}>
      <button
        type="button"
        aria-label={label}
        aria-pressed={active}
        data-active={active}
        onClick={onClick}
        className={cn(
          "reader-chrome-btn flex h-10 w-10 items-center justify-center rounded transition-transform active:scale-95",
          active && "[&_.reader-tool-icon-img]:brightness-0 [&_.reader-tool-icon-img]:invert",
        )}
      >
        {children}
      </button>
    </ReaderTooltip>
  );
}

type ColorPaletteProps = {
  presets: readonly { name: string; value: string }[];
  activeColor: string;
  recentColors: string[];
  onPickColor: (color: string) => void;
  onColorChange: (color: string) => void;
  onCommitColor: (color: string) => void;
};

function ColorPalette({
  presets,
  activeColor,
  recentColors,
  onPickColor,
  onColorChange,
  onCommitColor,
}: ColorPaletteProps) {
  return (
    <div className="acrobat-toolbar-section">
      {presets.map((preset) => (
        <button
          key={preset.name}
          type="button"
          title={preset.name}
          className={cn(
            "h-3.5 w-3.5 rounded-full border transition hover:scale-110",
            activeColor.toLowerCase() === preset.value.toLowerCase()
              ? "border-white ring-1 ring-[#c9952a]"
              : "border-white/25",
          )}
          style={{ backgroundColor: preset.value }}
          onClick={() => onPickColor(preset.value)}
        />
      ))}
      {recentColors.slice(0, 2).map((color, index) => (
        <button
          key={`${index}-${color}`}
          type="button"
          title="Recent color"
          className={cn(
            "h-3.5 w-3.5 rounded-full border transition hover:scale-110",
            activeColor.toLowerCase() === color.toLowerCase()
              ? "border-white ring-1 ring-[#c9952a]"
              : "border-white/25",
          )}
          style={{ backgroundColor: color }}
          onClick={() => onPickColor(color)}
        />
      ))}
      <label
        title="Pick a custom color"
        aria-label="Pick a custom color"
        className="relative flex h-3.5 w-3.5 cursor-pointer items-center justify-center rounded-full border border-dashed border-white/35 bg-white/5 text-white/70 transition hover:scale-110 hover:border-white/55 hover:bg-white/10"
      >
        <PaletteIcon />
        <input
          type="color"
          value={activeColor}
          onChange={(e) => onColorChange(e.target.value)}
          onBlur={(e) => onCommitColor(e.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </label>
    </div>
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
        className="acrobat-tool-btn acrobat-tool-group-btn relative flex h-10 w-10 items-center justify-center rounded transition-transform active:scale-95"
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
                {selected && <CheckIcon className="shrink-0 text-[#c9952a]" />}
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
      <ReaderTooltip label="Line thickness">
        <button
          type="button"
          aria-label="Line thickness"
          aria-expanded={open}
          aria-haspopup="dialog"
          data-active={open}
          onClick={() => onOpenChange(!open)}
          className="reader-chrome-btn acrobat-tool-group-btn relative flex h-10 w-10 items-center justify-center rounded transition-transform active:scale-95"
        >
          <LineThicknessIcon />
        </button>
      </ReaderTooltip>

      {open && (
        <div className="acrobat-tool-flyout acrobat-thickness-flyout" role="dialog" aria-label="Line thickness">
          <div className="flex flex-col items-center gap-2 px-3 py-3">
            <span className="text-[10px] tabular-nums text-[var(--reader-text-muted)]">{MAX_STROKE_WIDTH}</span>
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
            <span className="text-[11px] font-medium tabular-nums text-[var(--reader-text)]">{value}px</span>
          </div>
        </div>
      )}
    </div>
  );
}

type LeftToolbarProps = {
  tool: ReaderTool;
  onSelectTool: (tool: ReaderTool, options?: { force?: boolean }) => void;
  anchorPageWidth: number | null;
  highlightColor: string;
  penColor: string;
  recentHighlightColors: string[];
  recentPenColors: string[];
  onPickHighlightColor: (color: string) => void;
  onCommitHighlightColor: (color: string) => void;
  onHighlightColorChange: (color: string) => void;
  onPickPenColor: (color: string) => void;
  onCommitPenColor: (color: string) => void;
  onPenColorChange: (color: string) => void;
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
  anchorPageWidth,
  highlightColor,
  penColor,
  recentHighlightColors,
  recentPenColors,
  onPickHighlightColor,
  onCommitHighlightColor,
  onHighlightColorChange,
  onPickPenColor,
  onCommitPenColor,
  onPenColorChange,
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
  const showHighlightColorPanel = tool === "highlight";
  const showPenColorPanel = tool === "pen";
  const showHighlightThickness = tool === "highlight";
  const showPenThickness = tool === "pen" || tool === "shape";
  const showEraserControls = tool === "eraser";
  const showNoteColors = tool === "note" || (editingNote && tool !== "comment");

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
    <DraggableToolbar id="left-toolbar" anchorPageWidth={anchorPageWidth}>
      <div className="reader-toolbar-group">
        <ToolButton active={tool === "read"} label="Select" onClick={() => onSelectTool("read", { force: true })}>
          <CursorIcon />
        </ToolButton>
        <ToolButton active={tool === "pan"} label="Pan" onClick={() => onSelectTool("pan", { force: true })}>
          <ReaderToolIcon src={READER_TOOL_ICONS.hand} alt="Pan" />
        </ToolButton>
      </div>

      <div className="reader-toolbar-section">
        <div className="reader-toolbar-group">
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
            <ReaderToolIcon src={READER_TOOL_ICONS.pen} alt="Pen" accentColor={penColor} />
          </ToolButton>

          <ToolButton active={tool === "note"} label="Sticky note" onClick={() => onSelectTool("note")}>
            <ReaderToolIcon src={READER_TOOL_ICONS.note} alt="Sticky note" />
          </ToolButton>
          <ToolButton active={tool === "comment"} label="Comment" onClick={() => onSelectTool("comment")}>
            <CommentIcon />
          </ToolButton>

          <ToolButton active={tool === "eraser"} label="Eraser" onClick={() => onSelectTool("eraser")}>
            <ReaderToolIcon src={READER_TOOL_ICONS.eraser} alt="Eraser" />
          </ToolButton>
        </div>
      </div>

      <div className="reader-toolbar-section border-t-0 pt-0">
        <div ref={shapesRef} className="relative">
          <ReaderTooltip label="Shapes">
            <button
              type="button"
              aria-label="Shapes"
              aria-expanded={openGroup === "shapes"}
              aria-haspopup="menu"
              data-active={tool === "shape"}
              onClick={() => {
                onSelectTool("shape", { force: true });
                setOpenGroup((current) => (current === "shapes" ? null : "shapes"));
              }}
              className="reader-chrome-btn acrobat-tool-group-btn relative flex h-10 w-10 items-center justify-center rounded transition-transform active:scale-95"
            >
            {shapeKind === "rect" ? (
              <ShapeRectIcon />
            ) : shapeKind === "ellipse" ? (
              <ShapeCircleIcon />
            ) : shapeKind === "line" ? (
              <ShapeLineIcon />
            ) : shapeKind === "arrow" ? (
              <ShapeSingleArrowIcon />
            ) : shapeKind === "double_arrow" ? (
              <ShapeArrowIcon />
            ) : (
              <ShapesIcon />
            )}
          </button>
          </ReaderTooltip>

          {openGroup === "shapes" && (
            <div className="reader-tool-flyout min-w-[10.5rem]" role="menu">
              {(
                [
                  { kind: "rect" as const, label: "Rectangle", icon: <ShapeRectIcon /> },
                  { kind: "ellipse" as const, label: "Circle", icon: <ShapeCircleIcon /> },
                  { kind: "line" as const, label: "Line", icon: <ShapeLineIcon /> },
                  { kind: "arrow" as const, label: "Arrow", icon: <ShapeSingleArrowIcon /> },
                  { kind: "double_arrow" as const, label: "Double arrow", icon: <ShapeArrowIcon /> },
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
                    className="reader-tool-flyout-item"
                    onClick={() => {
                      onShapeKindChange(option.kind);
                      onSelectTool("shape", { force: true });
                    }}
                  >
                    <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center">
                      {option.icon}
                    </span>
                    <span className="flex-1 text-left">{option.label}</span>
                    {selected && <CheckIcon className="shrink-0 text-[#c9952a]" />}
                  </button>
                );
              })}
              <div className="border-t border-[var(--reader-divider)] px-3 py-2">
                <div className="flex items-center justify-between gap-2 text-[11px] text-[var(--reader-text-muted)]">
                  <span>Fill</span>
                  <button
                    type="button"
                    className={cn(
                      "rounded px-2 py-0.5 text-[10px] font-medium transition",
                      shapeFilled
                        ? "bg-[#c9952a] text-white"
                        : "bg-[var(--reader-info-bg)] text-[var(--reader-text-muted)] hover:bg-[var(--reader-btn-hover-bg)]",
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
      </div>

      {showEraserControls && (
        <div className="reader-toolbar-section">
          <ThicknessSliderFlyout
            value={eraserStrokeWidth}
            onChange={onEraserStrokeWidthChange}
            open={openGroup === "eraserThickness"}
            onOpenChange={(open) => setOpenGroup(open ? "eraserThickness" : null)}
          />
        </div>
      )}

      {showHighlightColorPanel && (
        <ColorPalette
          presets={HIGHLIGHT_PRESETS}
          activeColor={highlightColor}
          recentColors={recentHighlightColors}
          onPickColor={onPickHighlightColor}
          onColorChange={onHighlightColorChange}
          onCommitColor={onCommitHighlightColor}
        />
      )}

      {showHighlightThickness && (
        <div className="reader-toolbar-section border-t-0 pt-0">
          <ThicknessSliderFlyout
            value={highlightStrokeWidth}
            onChange={onHighlightStrokeWidthChange}
            open={openGroup === "thickness"}
            onOpenChange={(open) => setOpenGroup(open ? "thickness" : null)}
          />
        </div>
      )}

      {showPenColorPanel && (
        <ColorPalette
          presets={PEN_PRESETS}
          activeColor={penColor}
          recentColors={recentPenColors}
          onPickColor={onPickPenColor}
          onColorChange={onPenColorChange}
          onCommitColor={onCommitPenColor}
        />
      )}

      {showPenThickness && (
        <div className={cn("reader-toolbar-section", showPenColorPanel && "border-t-0 pt-0")}>
          <ThicknessSliderFlyout
            value={penStrokeWidth}
            onChange={onPenStrokeWidthChange}
            open={openGroup === "thickness"}
            onOpenChange={(open) => setOpenGroup(open ? "thickness" : null)}
          />
        </div>
      )}

      {showNoteColors && (
        <div
          id="note-toolbar"
          className="reader-toolbar-section"
          onMouseDown={(e) => e.preventDefault()}
        >
          {STICKY_NOTE_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              title={c.name}
              className={cn(
                "h-3.5 w-3.5 rounded-sm border transition hover:scale-110",
                noteTextColor === c.value
                  ? "border-white ring-1 ring-[#0a84ff]"
                  : "border-white/25",
              )}
              style={{ backgroundColor: c.swatch }}
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
