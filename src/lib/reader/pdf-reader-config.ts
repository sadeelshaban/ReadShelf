export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 6;
/** Multiplicative zoom for +/- buttons (~8% per click). */
export const ZOOM_BUTTON_FACTOR = 1.08;
/** @deprecated Prefer ZOOM_BUTTON_FACTOR; kept for typed percent nudges. */
export const ZOOM_STEP = 0.05;
export const DEFAULT_ZOOM = 0.55;
/** Pixel-delta → log-zoom scale for Ctrl/Meta + wheel / trackpad pinch. */
export const WHEEL_ZOOM_SENSITIVITY = 0.0035;
/** Wait after last zoom input before crisp PDF re-render. */
export const ZOOM_COMMIT_MS = 150;
/**
 * Cap canvas bitmap scale (cssZoom * devicePixelRatio).
 * Keeps scroll smooth when zoomed in — CSS size stays exact, bitmap may be slightly softer.
 */
export const MAX_RENDER_PIXEL_SCALE = 2.75;
export const PAGE_RENDER_BUFFER = 2;
export const SCROLL_SYNC_DEBOUNCE_MS = 100;
export const SCROLL_PROGRESS_DEBOUNCE_MS = 500;
export const READING_IDLE_SAVE_MS = 5000;
export const PROGRAMMATIC_SCROLL_TIMEOUT_MS = 900;
