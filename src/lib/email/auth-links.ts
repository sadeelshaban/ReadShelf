import { createServiceClient } from "@/lib/supabase/service";
import { getSiteUrl } from "./config";

function authCallbackUrl(request: Request | undefined, nextPath: string): string {
  const site = getSiteUrl(request);
  const callback = new URL("/auth/callback", site);
  callback.searchParams.set("next", nextPath);
  return callback.toString();
}

function isExistingUserError(message: string): boolean {
  return /already registered|already exists|already been registered|user already/i.test(
    message,
  );
}

export async function createSignupLink(
  request: Request,
  email: string,
  password: string,
): Promise<{ actionLink: string } | { error: "exists" | "other"; message: string }> {
  const supabase = createServiceClient();
  const redirectTo = authCallbackUrl(request, "/login");

  const { data, error } = await supabase.auth.admin.generateLink({
    type: "signup",
    email,
    password,
    options: { redirectTo },
  });

  if (error) {
    if (isExistingUserError(error.message)) {
      return { error: "exists", message: error.message };
    }
    return { error: "other", message: error.message };
  }

  const actionLink = data.properties?.action_link;
  if (!actionLink) {
    return { error: "other", message: "Could not create confirmation link." };
  }

  return { actionLink };
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
