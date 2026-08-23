"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PhotoThumbnail } from "@/components/tables/PhotoThumbnail";
import { EmptyState } from "@/components/tables/EmptyState";
import {
  generateStudentResultsReportPdf,
  type ReportMode,
} from "@/features/reports/lib/generateStudentResultsReportPdf";
import type { StudentResultsReportRow } from "@/lib/services/result.service";

const POSITION_LABELS: Record<number, string> = { 1: "1st", 2: "2nd", 3: "3rd" };
const POSITION_BADGE_CLASS: Record<number, string> = {
  1: "bg-podium-gold/15 text-podium-gold border-podium-gold/30",
  2: "bg-muted text-muted-foreground border-border",
  3: "bg-podium-bronze/15 text-podium-bronze border-podium-bronze/30",
};
const positionLabel = (position: number) => POSITION_LABELS[position] ?? `#${position}`;

type Section = { key: string; title: string; subtitle?: string | null; rows: StudentResultsReportRow[] };

function buildSections(rows: StudentResultsReportRow[], mode: ReportMode): Section[] {
  if (mode === "position") {
    const byPosition = new Map<number, StudentResultsReportRow[]>();
    for (const row of rows) {
      const list = byPosition.get(row.position) ?? [];
      list.push(row);
      byPosition.set(row.position, list);
    }
    return Array.from(byPosition.entries())
      .sort(([a], [b]) => a - b)
      .map(([position, list]) => ({
        key: String(position),
        title: positionLabel(position),
        rows: list,
      }));
  }

  if (mode === "category") {
    const byCategory = new Map<string, StudentResultsReportRow[]>();
    for (const row of rows) {
      const list = byCategory.get(row.programCategory) ?? [];
      list.push(row);
      byCategory.set(row.programCategory, list);
    }
    return Array.from(byCategory.entries()).map(([category, list]) => ({
      key: category,
      title: category,
      rows: list,
    }));
  }

  const byGroup = new Map<string, StudentResultsReportRow[]>();
  for (const row of rows) {
    const key = row.houseId ?? "__none__";
    const list = byGroup.get(key) ?? [];
    list.push(row);
    byGroup.set(key, list);
  }
  return Array.from(byGroup.entries()).map(([key, list]) => ({
    key,
    title: list[0]?.houseName ?? "Unassigned",
    rows: list,
  }));
}

function ReportTable({
  mode,
  rows,
  categoryLabels,
}: {
  mode: ReportMode;
  rows: StudentResultsReportRow[];
  categoryLabels: Record<string, string>;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {mode !== "position" ? <TableHead>Position</TableHead> : null}
          <TableHead>Student</TableHead>
          <TableHead>Roll No</TableHead>
          <TableHead>Class</TableHead>
          {mode !== "group" ? <TableHead>House</TableHead> : null}
          {mode !== "category" ? <TableHead>Category</TableHead> : null}
          <TableHead>Program</TableHead>
          <TableHead className="text-right">Points</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            {mode !== "position" ? (
              <TableCell>
                <Badge
                  variant="outline"
                  className={`w-10 justify-center ${POSITION_BADGE_CLASS[row.position] ?? ""}`}
                >
                  {positionLabel(row.position)}
                </Badge>
              </TableCell>
            ) : null}
            <TableCell className="font-medium">
              <div className="flex items-center gap-2.5">
                <PhotoThumbnail url={row.photoUrl} alt={`${row.studentName} photo`} className="size-8" />
                <div className="min-w-0">
                  <p className="truncate">{row.studentName}</p>
                  {row.studentMalayalamName ? (
                    <p className="truncate text-xs font-normal text-muted-foreground">
                      {row.studentMalayalamName}
                    </p>
                  ) : null}
                </div>
              </div>
            </TableCell>
            <TableCell className="tabular-nums">{row.rollNumber}</TableCell>
            <TableCell>{row.className}</TableCell>
            {mode !== "group" ? <TableCell>{row.houseName ?? "—"}</TableCell> : null}
            {mode !== "category" ? (
              <TableCell>{categoryLabels[row.programCategory] ?? row.programCategory}</TableCell>
            ) : null}
            <TableCell>{row.programName}</TableCell>
            <TableCell className="text-right tabular-nums">{row.points}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function ReportTab({
  mode,
  rows,
  categoryLabels,
}: {
  mode: ReportMode;
  rows: StudentResultsReportRow[];
  categoryLabels: Record<string, string>;
}) {
  const [isExporting, setIsExporting] = useState(false);
  const sections = useMemo(() => buildSections(rows, mode), [rows, mode]);

  function handleExport() {
    setIsExporting(true);
    try {
      generateStudentResultsReportPdf(rows, mode, categoryLabels, `results-report-${mode}.pdf`);
    } finally {
      setIsExporting(false);
    }
  }

  if (sections.length === 0) {
    return (
      <EmptyState
        title="No published results yet"
        description="Students appear here once their program's results are published."
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

      <div className="flex flex-col gap-4">
        {sections.map((section) => (
          <Card key={section.key}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-3">
                <span>
                  {mode === "category" ? categoryLabels[section.title] ?? section.title : section.title}
                </span>
                <span className="shrink-0 text-sm font-normal text-muted-foreground">
                  {section.rows.length} student{section.rows.length === 1 ? "" : "s"}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ReportTable mode={mode} rows={section.rows} categoryLabels={categoryLabels} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/**
 * Admin "Results Report": every published program's results (position-uncapped, one row
 * per student — a group program's team result is expanded to one row per member),
 * viewable three ways in one page rather than three separate pages, since all three are
 * the same underlying rows just grouped differently. Each tab has its own "Export to
 * PDF" button (generateStudentResultsReportPdf), same non-DOM-capture approach as
 * WinnersReportBrowser, so the PDF's pagination isn't tied to the page's own layout.
 */
export function StudentResultsReportBrowser({
  rows,
  categoryLabels,
}: {
  rows: StudentResultsReportRow[];
  categoryLabels: Record<string, string>;
}) {
  return (
    <Tabs defaultValue="position">
      <TabsList>
        <TabsTrigger value="position">By Position</TabsTrigger>
        <TabsTrigger value="category">By Category</TabsTrigger>
        <TabsTrigger value="group">By Group</TabsTrigger>
      </TabsList>
      <TabsContent value="position">
        <ReportTab mode="position" rows={rows} categoryLabels={categoryLabels} />
      </TabsContent>
      <TabsContent value="category">
        <ReportTab mode="category" rows={rows} categoryLabels={categoryLabels} />
      </TabsContent>
      <TabsContent value="group">
        <ReportTab mode="group" rows={rows} categoryLabels={categoryLabels} />
      </TabsContent>
    </Tabs>
  );
}
