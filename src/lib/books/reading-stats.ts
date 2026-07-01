export function isBookFinished(progressPercent: number) {
  return progressPercent >= 100;
}

export function formatReadCount(count: number) {
  if (count <= 0) return null;
  if (count === 1) return "Read once";
  return `Read ${count} times`;
}

export function formatLastOpened(iso: string, now = new Date()) {
  const date = new Date(iso);
  const time = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);

  const startOfDay = (value: Date) =>
    new Date(value.getFullYear(), value.getMonth(), value.getDate());
  const dayDiff = Math.round(
    (startOfDay(now).getTime() - startOfDay(date).getTime()) / 86_400_000,
  );

  if (dayDiff === 0) return `Today ${time}`;
  if (dayDiff === 1) return `Yesterday ${time}`;
  if (dayDiff < 7) {
    const weekday = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(date);
    return `${weekday} ${time}`;
  }

  const datePart = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    ...(date.getFullYear() !== now.getFullYear() ? { year: "numeric" as const } : {}),
  }).format(date);

  return `${datePart} ${time}`;
}
