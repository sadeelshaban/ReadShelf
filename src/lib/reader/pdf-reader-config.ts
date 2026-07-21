export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 6;
/** Button +/- step (5%). Wheel zoom is continuous and commits after the gesture. */
export const ZOOM_STEP = 0.05;
export const DEFAULT_ZOOM = 0.55;
/** Pixel-delta → log-zoom scale for Ctrl/Meta + wheel / trackpad pinch. */
export const WHEEL_ZOOM_SENSITIVITY = 0.003;
/** Wait this long after the last wheel tick before re-rendering PDF pages crisply. */
export const ZOOM_COMMIT_MS = 120;
export const PAGE_RENDER_BUFFER = 2;
export const SCROLL_SYNC_DEBOUNCE_MS = 80;
export const SCROLL_PROGRESS_DEBOUNCE_MS = 400;
export const READING_IDLE_SAVE_MS = 5000;
export const PROGRAMMATIC_SCROLL_TIMEOUT_MS = 900;
