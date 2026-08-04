import type { Metadata } from "next";
import {
  listAllResultsForCertificates,
  listPodiumResultsForCertificates,
} from "@/lib/services/result.service";
import { getCertificateSettings } from "@/lib/services/certificateSettings.service";
import { CATEGORIES } from "@/constants/programs";
import { CertificatesBrowser } from "@/features/certificates/components/CertificatesBrowser";

export const metadata: Metadata = { title: "Certificates" };

const categoryLabels = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]));

/**
 * Dedicated certificate-printing home for the whole festival, distinct from the
 * per-program "Print Certificates" dialog on /admin/programs/[id] (ResultsPanel) — that
 * one stays for "I'm already on this program's page, print its podium now"; this page is
 * for browsing every podium finish across every program at once, either by student
 * (every certificate one student has earned) or by program (a given program's podium),
 * toggled via CertificatesBrowser's tabs rather than two separate routes.
 */
export default async function CertificatesPage() {
  const [podiumRows, allRows, certificateSettings] = await Promise.all([
    listPodiumResultsForCertificates(),
    listAllResultsForCertificates(),
    getCertificateSettings(),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-heading text-xl font-medium">Certificates</h1>
        <p className="text-sm text-muted-foreground">
          Print podium or participation certificates by student or by program.
        </p>
      </div>

      <CertificatesBrowser
        podiumRows={podiumRows}
        allRows={allRows}
        categoryLabels={categoryLabels}
        certificateSettings={certificateSettings}
      />
    </div>
  );
}
