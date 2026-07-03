import { getFeedbackCategoryLabel, type FeedbackCategory } from "@/lib/feedback/categories";
import { createServiceClient } from "@/lib/supabase/service";

export type AdminFeedbackRow = {
  id: string;
  userEmail: string;
  category: FeedbackCategory;
  categoryLabel: string;
  message: string;
  createdAt: string;
};

export async function listAdminFeedback(): Promise<AdminFeedbackRow[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("feedback")
    .select("id, user_email, category, message, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => {
    const category = row.category as FeedbackCategory;
    return {
      id: row.id as string,
      userEmail: row.user_email as string,
      category,
      categoryLabel: getFeedbackCategoryLabel(category),
      message: row.message as string,
      createdAt: row.created_at as string,
    };
  });
}
