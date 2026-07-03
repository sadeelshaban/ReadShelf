import { redirect } from "next/navigation";
import { AdminFeedbackPanel } from "@/components/admin/AdminFeedbackPanel";
import { isAdminUser } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

export default async function AdminFeedbackPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/admin/feedback");
  }

  if (!isAdminUser(user)) {
    redirect("/shelf");
  }

  return (
    <div>
      <div className="mb-10">
        <h1 className="font-serif text-4xl font-semibold tracking-tight text-text sm:text-5xl">
          Feedback
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          Private user notes with the submitter&apos;s email for follow-up.
        </p>
      </div>

      <AdminFeedbackPanel embedded />
    </div>
  );
}
