import type { Metadata } from "next";
import { listWinnersReportByGroup } from "@/lib/services/result.service";
import { CATEGORIES } from "@/constants/programs";
import { WinnersReportBrowser } from "@/features/reports/components/WinnersReportBrowser";

export const metadata: Metadata = { title: "Winners Report" };

const categoryLabels = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]));

/**
 * House-wise winners report: every published program's top-3 finish, sectioned by
 * house (not by program, unlike /admin/results-poster) — a printable/PDF document for
 * a prize-distribution ceremony. Same "published only" scope as the poster page.
 */
export default async function WinnersReportPage() {
  const groups = await listWinnersReportByGroup();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-heading text-xl font-medium">Winners Report</h1>
        <p className="text-sm text-muted-foreground">
          Every published program&apos;s top-3 finish, grouped by house, ranked by total
          points — export to PDF to print for a prize-distribution ceremony.
        </p>
      </div>

      <WinnersReportBrowser groups={groups} categoryLabels={categoryLabels} />
    </div>
  );
}
