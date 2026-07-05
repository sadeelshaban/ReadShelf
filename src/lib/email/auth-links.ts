import { createServiceClient } from "@/lib/supabase/service";

function isExistingUserError(message: string): boolean {
  return /already registered|already exists|already been registered|user already/i.test(
    message,
  );
}

export async function createUserAccount(
  email: string,
  password: string,
): Promise<{ userId: string } | { error: "exists" | "other"; message: string }> {
  const supabase = createServiceClient();

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    if (isExistingUserError(error.message)) {
      return { error: "exists", message: error.message };
    }
    return { error: "other", message: error.message };
  }

  if (!data.user?.id) {
    return { error: "other", message: "Could not create account." };
  }

  return { userId: data.user.id };
}

export async function createRecoveryOtp(email: string): Promise<string | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase.auth.admin.generateLink({
    type: "recovery",
    email,
  });

  if (error || !data.properties?.email_otp) {
    return null;
  }

  return data.properties.email_otp;
}
