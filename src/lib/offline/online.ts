export function isOnline() {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}

export function onOnline(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("online", callback);
  return () => window.removeEventListener("online", callback);
}
