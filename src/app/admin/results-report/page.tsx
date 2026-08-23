import type { Metadata } from "next";
import { listStudentResultsReport } from "@/lib/services/result.service";
import { CATEGORIES } from "@/constants/programs";
import { StudentResultsReportBrowser } from "@/features/reports/components/StudentResultsReportBrowser";

export const metadata: Metadata = { title: "Results Report" };

const categoryLabels = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]));

/**
 * Full student results report: every published program's results, position-uncapped
 * (unlike /admin/reports's top-3-only Winners Report), one row per student — viewable
 * by position, category, or group (house) in one page. A printable/PDF document for
 * handing out class-wise/category-wise/house-wise result lists after an event.
 */
export default async function ResultsReportPage() {
  const rows = await listStudentResultsReport();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-heading text-xl font-medium">Results Report</h1>
        <p className="text-sm text-muted-foreground">
          Every published program&apos;s results, with full student details — grouped by
          position, category, or house.
        </p>
      </div>

      <StudentResultsReportBrowser rows={rows} categoryLabels={categoryLabels} />
    </div>
  );
}
