export const FEEDBACK_CATEGORIES = [
  { value: "design", label: "Design & appearance" },
  { value: "bugs", label: "Bugs & errors" },
  { value: "feature", label: "Feature request" },
  { value: "general", label: "General / other" },
] as const;

export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number]["value"];

export function isFeedbackCategory(value: string): value is FeedbackCategory {
  return FEEDBACK_CATEGORIES.some((item) => item.value === value);
}

export function getFeedbackCategoryLabel(category: FeedbackCategory): string {
  return FEEDBACK_CATEGORIES.find((item) => item.value === category)?.label ?? category;
}
