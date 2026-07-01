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

export function touchDistance(touches: TouchList) {
  if (touches.length < 2) return 0;
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.hypot(dx, dy);
}
