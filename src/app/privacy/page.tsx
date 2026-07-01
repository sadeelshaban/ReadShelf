import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export const metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <LegalPageLayout title="Privacy Policy" updated="June 25, 2026">
      <section>
        <h2 className="font-serif text-xl font-semibold text-primary">1. Overview</h2>
        <p>
          ReadShelf (&quot;we&quot;, &quot;us&quot;) respects your privacy. This policy
          explains what data we collect, how we use it, and your choices when you use our
          PDF reading platform.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-xl font-semibold text-primary">2. Data we collect</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Account data:</strong> email address and authentication credentials
            (managed by Supabase Auth)
          </li>
          <li>
            <strong>Library data:</strong> book titles, authors, PDF files, covers, reading
            progress, highlights, notes, and bookmarks
          </li>
          <li>
            <strong>Usage data:</strong> last opened timestamps, presence heartbeat, and
            optional analytics if enabled by the operator
          </li>
          <li>
            <strong>Technical data:</strong> browser type, IP address (via hosting logs),
            and cookies required for session management
          </li>
        </ul>
      </section>

      <section>
        <h2 className="font-serif text-xl font-semibold text-primary">3. How we use data</h2>
        <p>We use your data to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Provide and secure the Service</li>
          <li>Sync your library across devices and support offline reading</li>
          <li>Send account-related emails (confirmation, password reset)</li>
          <li>Improve reliability and diagnose errors</li>
          <li>Comply with legal obligations</li>
        </ul>
        <p className="mt-3">We do not sell your personal data.</p>
      </section>

      <section>
        <h2 className="font-serif text-xl font-semibold text-primary">4. Storage &amp; processors</h2>
        <p>
          Data is stored on Supabase (PostgreSQL and object storage) and served through
          Vercel. Email delivery uses your configured SMTP provider. These processors act
          on our instructions and maintain their own security programs.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-xl font-semibold text-primary">5. Local device storage</h2>
        <p>
          The Service caches PDFs and annotations in your browser (IndexedDB) for offline
          access. This data remains on your device and is tied to your account when synced.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-xl font-semibold text-primary">6. Retention</h2>
        <p>
          We retain account and library data while your account is active. When you delete a
          book or account, associated files and records are removed from our systems subject
          to backup retention windows.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-xl font-semibold text-primary">7. Your rights</h2>
        <p>
          Depending on your location, you may have rights to access, correct, export, or
          delete your data. Contact us to exercise these rights. You may delete books from
          your shelf and request account deletion through support.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-xl font-semibold text-primary">8. Security</h2>
        <p>
          We use row-level security, signed URLs for files, HTTPS, and industry-standard
          authentication. No method of transmission or storage is 100% secure; use a strong
          unique password.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-xl font-semibold text-primary">9. Children</h2>
        <p>
          The Service is not directed at children under 13. We do not knowingly collect
          data from children.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-xl font-semibold text-primary">10. Changes &amp; contact</h2>
        <p>
          We may update this policy; the &quot;Last updated&quot; date will change.
          Questions:{" "}
          <a href="mailto:sadeelshabanmedia@gmail.com" className="text-primary hover:underline">
            sadeelshabanmedia@gmail.com
          </a>
        </p>
      </section>
    </LegalPageLayout>
  );
}
