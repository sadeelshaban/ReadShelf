import {
  READER_ERASER_HALO,
  READER_ERASER_RING,
  READER_ERASER_STROKE,
} from "@/lib/reader/constants";

type EraserCursorOverlayProps = {
  x: number;
  y: number;
  diameter: number;
};

export function EraserCursorOverlay({ x, y, diameter }: EraserCursorOverlayProps) {
  return (
    <div
      className="pointer-events-none fixed z-[60] rounded-full"
      style={{
        left: x,
        top: y,
        width: diameter,
        height: diameter,
        transform: "translate(-50%, -50%)",
        backgroundColor: READER_ERASER_RING,
        border: `1.75px solid ${READER_ERASER_STROKE}`,
        boxShadow: `0 0 0 2.5px ${READER_ERASER_HALO}`,
      }}
      aria-hidden
    />
  );
}
