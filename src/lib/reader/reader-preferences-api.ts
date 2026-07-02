export async function syncReaderDarkModePreference(darkMode: boolean): Promise<void> {
  try {
    await fetch("/api/user/reader-preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ darkMode }),
      keepalive: true,
    });
  } catch {
    // Offline or unauthenticated — local preference still applies.
  }
}

export async function fetchReaderDarkModePreference(): Promise<boolean | null> {
  try {
    const response = await fetch("/api/user/reader-preferences", {
      method: "GET",
      cache: "no-store",
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { darkMode?: boolean };
    return typeof data.darkMode === "boolean" ? data.darkMode : null;
  } catch {
    return null;
  }
}
