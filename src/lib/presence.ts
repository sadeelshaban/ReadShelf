/** How recently a user must have pinged to count as online (ms). */
export const ONLINE_THRESHOLD_MS = 60_000;

/** Client heartbeat interval (ms). */
export const PRESENCE_PING_MS = 25_000;

export function isUserOnline(lastSeenAt: string | null | undefined): boolean {
  if (!lastSeenAt) return false;
  return Date.now() - new Date(lastSeenAt).getTime() <= ONLINE_THRESHOLD_MS;
}
