import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function SetupPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
        <Link href="/" className="font-serif text-2xl font-semibold text-primary">
          ReadShelf
        </Link>
        <Link href="/">
          <Button variant="secondary" size="sm">
            Home
          </Button>
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-6 pb-16">
        <h1 className="font-serif text-4xl font-semibold text-text">
          Supabase setup
        </h1>
        <p className="mt-3 text-text/75">
          Use your account email:{" "}
          <strong>sadeelshabanmedia@gmail.com</strong>
        </p>

        <div className="mt-8 rounded-2xl border border-accent/40 bg-card p-6 shadow-sm">
          <h2 className="font-serif text-xl font-semibold text-primary">
            Automatic setup (recommended)
          </h2>
          <p className="mt-2 text-text/80">
            We prepared a script that creates the Supabase project, writes{" "}
            <code className="rounded bg-background px-1">.env.local</code>, and
            applies the database schema for you.
          </p>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-text/80">
            <li>
              Create a free account at{" "}
              <a
                href="https://supabase.com/dashboard/sign-up"
                className="text-primary underline"
                target="_blank"
                rel="noreferrer"
              >
                supabase.com
              </a>{" "}
              with Google or your Gmail.
            </li>
            <li>
              In the project folder, run in PowerShell:
              <pre className="mt-2 overflow-x-auto rounded-xl bg-background p-4 text-sm text-text">
                npm run setup:supabase
              </pre>
            </li>
            <li>
              When the browser opens for CLI login, sign in with the same Gmail
              account.
            </li>
            <li>
              Wait until the script finishes, then restart the app:
              <pre className="mt-2 overflow-x-auto rounded-xl bg-background p-4 text-sm text-text">
                npm run dev
              </pre>
            </li>
            <li>
              Open{" "}
              <Link href="/signup" className="text-primary underline">
                /signup
              </Link>{" "}
              and create your ReadShelf account with the same email.
            </li>
          </ol>
        </div>

        <div className="mt-8 rounded-2xl border border-accent/40 bg-card p-6 shadow-sm">
          <h2 className="font-serif text-xl font-semibold text-primary">
            Firebase Storage (~5 GB for PDFs)
          </h2>
          <p className="mt-2 text-text/80">
            Supabase free storage is ~1 GB. For a larger personal library, connect
            Firebase Storage. Auth and sync stay on Supabase; only PDFs and covers
            move to Firebase.
          </p>
          <p className="mt-3 text-sm text-text/70">
            Create a Firebase project, enable Storage, add a service account key to{" "}
            <code className="rounded bg-background px-1">.env.local</code>, apply
            CORS from <code className="rounded bg-background px-1">scripts/firebase-storage-cors.json</code>,
            then restart <code className="rounded bg-background px-1">npm run dev</code> and
            upload a new book.
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-soft-gray/30 bg-card p-6">
          <p className="mt-2 text-text/80">
            In Supabase Dashboard → Authentication → Providers → Email, disable
            &quot;Confirm email&quot; for easier local testing.
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-soft-gray/30 bg-card p-6">
          <h2 className="font-serif text-xl font-semibold text-primary">
            Manual setup
          </h2>
          <p className="mt-2 text-text/80">
            Copy{" "}
            <code className="rounded bg-background px-1">.env.local.example</code>{" "}
            to{" "}
            <code className="rounded bg-background px-1">.env.local</code>, run
            the SQL in{" "}
            <code className="rounded bg-background px-1">
              supabase/migrations/001_initial_schema.sql
            </code>
            , and create storage buckets{" "}
            <code className="rounded bg-background px-1">book-pdfs</code> and{" "}
            <code className="rounded bg-background px-1">book-covers</code>.
          </p>
        </div>
      </main>
    </div>
  );
}
