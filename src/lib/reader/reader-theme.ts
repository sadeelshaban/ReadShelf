export const READER_DARK_MODE_KEY = "readshelf-reader-dark-mode";
export const READER_FOCUS_MODE_KEY = "readshelf-reader-focus-mode";

export function loadReaderDarkMode(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(READER_DARK_MODE_KEY) === "1";
}

export function saveReaderDarkMode(enabled: boolean) {
  localStorage.setItem(READER_DARK_MODE_KEY, enabled ? "1" : "0");
}

export function loadReaderFocusMode(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(READER_FOCUS_MODE_KEY) === "1";
}

export function saveReaderFocusMode(enabled: boolean) {
  localStorage.setItem(READER_FOCUS_MODE_KEY, enabled ? "1" : "0");
}
