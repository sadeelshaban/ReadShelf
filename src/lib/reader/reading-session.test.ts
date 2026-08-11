import { afterEach, describe, expect, it } from "vitest";
import {
  markFreshLoginSession,
  markResumePromptHandled,
  READING_RESUME_PROMPT_MIN_MS,
  shouldShowReadingResumePrompt,
} from "@/lib/reader/reading-session";

afterEach(() => {
  sessionStorage.clear();
});

describe("shouldShowReadingResumePrompt", () => {
  it("shows after a fresh login even within two hours", () => {
    markFreshLoginSession();
    const lastOpenedAt = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    expect(shouldShowReadingResumePrompt("book-1", lastOpenedAt)).toBe(true);
  });

  it("hides within two hours when the session is not fresh", () => {
    const lastOpenedAt = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    expect(shouldShowReadingResumePrompt("book-1", lastOpenedAt)).toBe(false);
  });

  it("shows after two hours without a fresh login", () => {
    const lastOpenedAt = new Date(
      Date.now() - READING_RESUME_PROMPT_MIN_MS - 1_000,
    ).toISOString();
    expect(shouldShowReadingResumePrompt("book-1", lastOpenedAt)).toBe(true);
  });

  it("does not repeat after the prompt was handled this session", () => {
    markFreshLoginSession();
    markResumePromptHandled("book-1");
    const lastOpenedAt = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    expect(shouldShowReadingResumePrompt("book-1", lastOpenedAt)).toBe(false);
  });
});
