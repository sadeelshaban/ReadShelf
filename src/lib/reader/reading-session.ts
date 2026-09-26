const FRESH_LOGIN_KEY = "readshelf-fresh-login";
const RESUME_HANDLED_PREFIX = "readshelf-resume-handled-";

export const READING_RESUME_PROMPT_MIN_MS = 2 * 60 * 60 * 1000;

export function markFreshLoginSession() {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(FRESH_LOGIN_KEY, "1");
}

export function isFreshLoginSession() {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(FRESH_LOGIN_KEY) === "1";
}

export function markResumePromptHandled(bookId: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(`${RESUME_HANDLED_PREFIX}${bookId}`, "1");
}

function isResumePromptHandled(bookId: string) {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(`${RESUME_HANDLED_PREFIX}${bookId}`) === "1";
}

export function shouldShowReadingResumePrompt(
  bookId: string,
  lastOpenedAt: string | null,
  now = Date.now(),
) {
  if (!lastOpenedAt || isResumePromptHandled(bookId)) {
    return false;
  }

  if (isFreshLoginSession()) {
    return true;
  }

  const lastReadMs = new Date(lastOpenedAt).getTime();
  if (!Number.isFinite(lastReadMs)) {
    return false;
  }

  return now - lastReadMs >= READING_RESUME_PROMPT_MIN_MS;
}
