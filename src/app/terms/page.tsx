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
        <h2 className="font-serif text-xl font-semibold text-primary">3. Your Account</h2>
        <p>
          You are responsible for maintaining the confidentiality of your login credentials
          and for all activity under your account. You must provide accurate information
          when registering and notify us of any unauthorized access.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-xl font-semibold text-primary">4. Your Content</h2>
        <p>
          You retain ownership of the PDFs and annotations you upload or create. You grant
          ReadShelf a limited license to store, process, and display your content solely to
          operate the Service on your behalf. You must not upload content you do not have
          the right to use.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-xl font-semibold text-primary">5. Acceptable Use</h2>
        <p>You agree not to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Violate any applicable law or third-party rights</li>
          <li>Upload malware, illegal material, or content that infringes copyright</li>
          <li>Attempt to access other users&apos; data or compromise platform security</li>
          <li>Reverse engineer or abuse the Service in ways that harm its availability</li>
        </ul>
      </section>

      <section>
        <h2 className="font-serif text-xl font-semibold text-primary">6. Availability</h2>
        <p>
          We strive to keep the Service available but do not guarantee uninterrupted access.
          Maintenance, third-party outages, or force majeure events may cause downtime. We may
          modify or discontinue features with reasonable notice where practicable.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-xl font-semibold text-primary">
          7. Disclaimer of Warranties
        </h2>
        <p>
          The Service is provided &quot;as is&quot; and &quot;as available,&quot; without
          warranties of any kind, whether express or implied, including — to the fullest
          extent permitted by law — warranties of merchantability, fitness for a particular
          purpose, and non-infringement. We do not warrant that the Service will be
          uninterrupted, error-free, or completely secure.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-xl font-semibold text-primary">
          8. Limitation of Liability
        </h2>
        <p>
          To the fullest extent permitted by law, ReadShelf and its operator are not liable
          for indirect, incidental, special, or consequential damages, or for loss of data
          beyond what reasonable backup practices would cover, arising from your use of the
          Service. You are responsible for maintaining your own copies of important
          documents.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-xl font-semibold text-primary">9. Indemnification</h2>
        <p>
          You agree to indemnify and hold ReadShelf and its operator harmless from any
          claims, damages, or expenses (including reasonable legal fees) arising from your
          misuse of the Service, your content, or your violation of these Terms or
          applicable law.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-xl font-semibold text-primary">10. Termination</h2>
        <p>
          You may stop using the Service at any time. We may suspend or terminate accounts
          that violate these Terms. Upon termination, your right to use the Service ends;
          data handling is described in our Privacy Policy.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-xl font-semibold text-primary">
          11. Governing Law &amp; Disputes
        </h2>
        <p>
          These Terms are governed by the laws of Palestine, without regard to
          conflict-of-law principles. Any dispute arising from these Terms or the Service
          will first be attempted to be resolved informally; if unresolved, it will be
          subject to the exclusive jurisdiction of the courts of Palestine.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-xl font-semibold text-primary">12. Changes</h2>
        <p>
          We may update these Terms from time to time. Material changes will be reflected
          on this page with an updated date. Continued use of the Service after changes
          constitutes acceptance of the revised Terms.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-xl font-semibold text-primary">13. Contact</h2>
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
