export function mergeAnnotationsById<T extends { id: string }>(
  ...lists: T[][]
): T[] {
  const map = new Map<string, T>();
  for (const list of lists) {
    for (const item of list) {
      map.set(item.id, item);
    }
  }
  return Array.from(map.values());
}
