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

export async function getFeedbackCount(): Promise<number> {
  const supabase = createServiceClient();
  const { count, error } = await supabase
    .from("feedback")
    .select("*", { count: "exact", head: true });

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

export async function getRecentFeedbackCount(days = 7): Promise<number> {
  const supabase = createServiceClient();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const { count, error } = await supabase
    .from("feedback")
    .select("*", { count: "exact", head: true })
    .gte("created_at", since.toISOString());

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}
