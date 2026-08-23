"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PhotoThumbnail } from "@/components/tables/PhotoThumbnail";
import { EmptyState } from "@/components/tables/EmptyState";
import { generateWinnersReportPdf } from "@/features/reports/lib/generateWinnersReportPdf";
import type { WinnersReportGroup } from "@/lib/services/result.service";

const POSITION_LABELS: Record<number, string> = { 1: "1st", 2: "2nd", 3: "3rd" };
const POSITION_BADGE_CLASS: Record<number, string> = {
  1: "bg-podium-gold/15 text-podium-gold border-podium-gold/30",
  2: "bg-muted text-muted-foreground border-border",
  3: "bg-podium-bronze/15 text-podium-bronze border-podium-bronze/30",
};

/**
 * House-wise winners report — one section per house (ordered by total points, highest
 * first), each listing every published program it placed in (top 3), with an
 * "Export to PDF" button that renders the same data straight to a downloadable PDF
 * (generateWinnersReportPdf) rather than capturing this page's DOM, so the page itself
 * can stay a plain scrollable list without any print-specific layout.
 */
export function WinnersReportBrowser({
  groups,
  categoryLabels,
}: {
  groups: WinnersReportGroup[];
  categoryLabels: Record<string, string>;
}) {
  const [isExporting, setIsExporting] = useState(false);

  function handleExport() {
    setIsExporting(true);
    try {
      generateWinnersReportPdf(groups, categoryLabels, "winners-report.pdf");
    } finally {
      setIsExporting(false);
    }
  }

  if (groups.length === 0) {
    return (
      <EmptyState
        title="No published results yet"
        description="Winners appear here, grouped by house, as programs are published."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button type="button" onClick={handleExport} disabled={isExporting}>
          <Download className="size-4" data-icon="inline-start" aria-hidden="true" />
          {isExporting ? "Preparing…" : "Export to PDF"}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {groups.map((group) => (
          <Card key={group.groupId}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <PhotoThumbnail url={group.groupPhotoUrl} alt={`${group.groupName} photo`} className="size-9" />
                <div className="min-w-0 flex-1">
                  <p className="truncate">{group.groupName}</p>
                  {group.groupMalayalamName ? (
                    <p className="truncate text-xs font-normal text-muted-foreground">
                      {group.groupMalayalamName}
                    </p>
                  ) : null}
                </div>
                <span className="shrink-0 font-mono text-sm font-semibold tabular-nums text-muted-foreground">
                  {group.totalPoints} pts
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="flex flex-col divide-y divide-border">
                {group.entries.map((entry) => (
                  <li
                    key={`${entry.programId}-${entry.position}`}
                    className="flex items-center gap-3 py-2 first:pt-0 last:pb-0"
                  >
                    <Badge
                      variant="outline"
                      className={`w-10 shrink-0 justify-center ${POSITION_BADGE_CLASS[entry.position] ?? ""}`}
                    >
                      {POSITION_LABELS[entry.position] ?? `#${entry.position}`}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{entry.programName}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {categoryLabels[entry.programCategory] ?? entry.programCategory}
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-xs font-semibold tabular-nums text-muted-foreground">
                      {entry.points} pts
                    </span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
