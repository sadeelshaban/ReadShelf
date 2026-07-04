import { createServiceClient } from "@/lib/supabase/service";

export async function isEmailConfirmed(email: string): Promise<boolean | null> {
  const supabase = createServiceClient();
  const normalized = email.trim().toLowerCase();
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 1000,
    });

    if (error) {
      throw new Error(error.message);
    }

    const user = data.users.find((entry) => entry.email?.toLowerCase() === normalized);
    if (user) {
      return Boolean(user.email_confirmed_at);
    }

    if (data.users.length < 1000) break;
    page += 1;
  }

  return null;
}
