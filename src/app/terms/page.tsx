import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export const metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <LegalPageLayout title="Terms of Service" updated="June 25, 2026">
      <section>
        <h2 className="font-serif text-xl font-semibold text-primary">1. Agreement</h2>
        <p>
          By accessing or using ReadShelf (&quot;the Service&quot;), you agree to these Terms
          of Service. If you do not agree, do not use the Service.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-xl font-semibold text-primary">2. The Service</h2>
        <p>
          ReadShelf provides a personal digital library for uploading, reading, and
          annotating PDF documents. Features include progress tracking, highlights, notes,
          bookmarks, and optional offline access after initial sync.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-xl font-semibold text-primary">3. Your account</h2>
        <p>
          You are responsible for maintaining the confidentiality of your login credentials
          and for all activity under your account. You must provide accurate information
          when registering and notify us of unauthorized access.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-xl font-semibold text-primary">4. Your content</h2>
        <p>
          You retain ownership of PDFs and annotations you upload or create. You grant
          ReadShelf a limited license to store, process, and display your content solely to
          operate the Service for you. You must not upload content you do not have the
          right to use.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-xl font-semibold text-primary">5. Acceptable use</h2>
        <p>You agree not to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Violate any applicable law or third-party rights</li>
          <li>Upload malware, illegal material, or content that infringes copyright</li>
          <li>Attempt to access other users&apos; data or compromise platform security</li>
          <li>Reverse engineer or abuse the Service in ways that harm availability</li>
        </ul>
      </section>

      <section>
        <h2 className="font-serif text-xl font-semibold text-primary">6. Availability</h2>
        <p>
          We strive to keep the Service available but do not guarantee uninterrupted access.
          Maintenance, third-party outages, or force majeure may cause downtime. We may
          modify or discontinue features with reasonable notice where practicable.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-xl font-semibold text-primary">7. Limitation of liability</h2>
        <p>
          The Service is provided &quot;as is&quot; to the fullest extent permitted by law.
          ReadShelf is not liable for indirect, incidental, or consequential damages, or for
          loss of data beyond what reasonable backup practices would cover. You are
          responsible for maintaining copies of important documents.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-xl font-semibold text-primary">8. Termination</h2>
        <p>
          You may stop using the Service at any time. We may suspend or terminate accounts
          that violate these Terms. Upon termination, your right to use the Service ends;
          data handling is described in our Privacy Policy.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-xl font-semibold text-primary">9. Changes</h2>
        <p>
          We may update these Terms. Material changes will be reflected on this page with an
          updated date. Continued use after changes constitutes acceptance.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-xl font-semibold text-primary">10. Contact</h2>
        <p>
          Questions about these Terms:{" "}
          <a href="mailto:sadeelshabanmedia@gmail.com" className="text-primary hover:underline">
            sadeelshabanmedia@gmail.com
          </a>
        </p>
      </section>
    </LegalPageLayout>
  );
}
