export function bindMapRef<T>(map: { current: Map<number, T> }, key: number) {
  return (el: T | null) => {
    if (el) map.current.set(key, el);
    else map.current.delete(key);
  };
}

export function canvasRefForPage(
  map: { current: Map<number, HTMLCanvasElement> },
  pageNumber: number,
): { current: HTMLCanvasElement | null } {
  return {
    get current() {
      return map.current.get(pageNumber) ?? null;
    },
    set current(_value: HTMLCanvasElement | null) {
      // read-only view into the page canvas map
    },
  };
}

export function isTouchDevice() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0
  );
}
