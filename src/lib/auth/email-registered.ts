import { createServiceClient } from "@/lib/supabase/service";

export async function emailIsRegistered(email: string): Promise<boolean> {
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

    if (data.users.some((user) => user.email?.toLowerCase() === normalized)) {
      return true;
    }

    if (data.users.length < 1000) break;
    page += 1;
  }

  return false;
}
