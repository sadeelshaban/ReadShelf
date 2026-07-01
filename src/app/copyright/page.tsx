import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { COPYRIGHT_NOTICE, LEGAL_ENTITY } from "@/lib/legal/constants";

export const metadata = {
  title: "Copyright Notice",
};

export default function CopyrightPage() {
  return (
    <LegalPageLayout title="Copyright Notice" updated="June 25, 2026">
      <section>
        <h2 className="font-serif text-xl font-semibold text-primary">Ownership</h2>
        <p>
          {COPYRIGHT_NOTICE} The {LEGAL_ENTITY} name, logo, user interface design, source
          code, documentation, and original written content are protected by copyright and
          other intellectual property laws.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-xl font-semibold text-primary">Your Uploaded Content</h2>
        <p>
          You retain all rights to the PDFs and materials you upload. ReadShelf does not
          claim ownership of your books, highlights, notes, or bookmarks. You are solely
          responsible for ensuring you have the right to upload and annotate any document.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-xl font-semibold text-primary">Third-Party Content</h2>
        <p>
          PDF documents may contain copyrighted text and images owned by their respective
          publishers or authors. ReadShelf provides tools for personal reading and
          annotation only — it does not grant any license to reproduce or distribute
          third-party works beyond what you already hold.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-xl font-semibold text-primary">Open-Source Components</h2>
        <p>
          The Service incorporates open-source software — including Next.js, React,
          Supabase client libraries, pdf.js, and pdf-lib — under their respective licenses.
          Those components remain subject to their original license terms.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-xl font-semibold text-primary">Trademarks</h2>
        <p>
          &quot;ReadShelf&quot; and the ReadShelf logo are trademarks of the platform
          operator. Do not use them in any way that suggests endorsement without written
          permission.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-xl font-semibold text-primary">DMCA / Infringement</h2>
        <p>
          If you believe content on the Service infringes your copyright, contact us with
          identification of the work, the infringing material, and your contact information.
          We will review and respond as appropriate.
        </p>
        <p className="mt-3">
          Email:{" "}
          <a href="mailto:sadeelshabanmedia@gmail.com" className="text-primary hover:underline">
            sadeelshabanmedia@gmail.com
          </a>
        </p>
      </section>

      <section>
        <h2 className="font-serif text-xl font-semibold text-primary">
          Acquisition &amp; Licensing
        </h2>
        <p>
          Commercial licensing, white-label deployment, or full product acquisition terms
          are negotiated separately in writing. Unauthorized copying or resale of the
          platform source code is prohibited unless expressly agreed.
        </p>
      </section>
    </LegalPageLayout>
  );
}
