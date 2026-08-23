import { jsPDF } from "jspdf";
import type { StudentResultsReportRow } from "@/lib/services/result.service";

// Landscape A4 — this report has more columns per row than the portrait Winners Report
// (student, roll number, class, house, category, program, position, points all at
// once), so the extra width keeps every column readable without wrapping. Same
// jsPDF-text-API approach as generateWinnersReportPdf.ts (not html2canvas): the report's
// length depends on how many results exist, and jsPDF's y-cursor + addPage() paginates
// that naturally.
const PAGE_WIDTH_MM = 297;
const PAGE_HEIGHT_MM = 210;
const MARGIN_MM = 14;
const BOTTOM_LIMIT_MM = PAGE_HEIGHT_MM - MARGIN_MM;
const ROW_HEIGHT_MM = 6;

export type ReportMode = "position" | "category" | "group";

type Column = { header: string; width: number; get: (row: StudentResultsReportRow) => string };

const POSITION_LABELS: Record<number, string> = { 1: "1st", 2: "2nd", 3: "3rd" };
const positionLabel = (position: number) => POSITION_LABELS[position] ?? `#${position}`;

function studentLabel(row: StudentResultsReportRow): string {
  return row.studentMalayalamName ? `${row.studentName} (${row.studentMalayalamName})` : row.studentName;
}

/**
 * Column set per tab — deliberately omits whichever field the section is already
 * grouped/headed by (position/category/house), same "don't repeat the heading" rule
 * ResultsPanel/WinnersReportBrowser already follow for their own grouping.
 */
function columnsForMode(mode: ReportMode, categoryLabels: Record<string, string>): Column[] {
  const program: Column = { header: "Program", width: 62, get: (r) => r.programName };
  const student: Column = { header: "Student", width: 58, get: studentLabel };
  const rollNumber: Column = { header: "Roll No", width: 22, get: (r) => r.rollNumber };
  const className: Column = { header: "Class", width: 18, get: (r) => r.className };
  const house: Column = { header: "House", width: 34, get: (r) => r.houseName ?? "—" };
  const category: Column = {
    header: "Category",
    width: 28,
    get: (r) => categoryLabels[r.programCategory] ?? r.programCategory,
  };
  const position: Column = { header: "Position", width: 20, get: (r) => positionLabel(r.position) };
  const points: Column = { header: "Points", width: 18, get: (r) => String(r.points) };

  switch (mode) {
    case "position":
      return [program, category, student, rollNumber, className, house, points];
    case "category":
      return [position, program, student, rollNumber, className, house, points];
    case "group":
      return [position, program, category, student, rollNumber, className, points];
  }
}

type Section = { title: string; subtitle?: string; rows: StudentResultsReportRow[] };

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
      .map(([position, list]) => ({ title: `${positionLabel(position)} place`, rows: list }));
  }

  if (mode === "category") {
    const byCategory = new Map<string, StudentResultsReportRow[]>();
    for (const row of rows) {
      const list = byCategory.get(row.programCategory) ?? [];
      list.push(row);
      byCategory.set(row.programCategory, list);
    }
    return Array.from(byCategory.entries()).map(([category, list]) => ({
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
  return Array.from(byGroup.values()).map((list) => ({
    title: list[0]?.houseName ?? "Unassigned",
    rows: list,
  }));
}

const MODE_TITLES: Record<ReportMode, string> = {
  position: "Results Report — By Position",
  category: "Results Report — By Category",
  group: "Results Report — By Group",
};

/**
 * Renders one tab of the Results Report (result.service.ts's listStudentResultsReport,
 * published programs only, every position) as a multi-page landscape PDF and triggers a
 * browser download. `categoryLabels` resolves the enum value to its display label, same
 * as WinnersReportBrowser/generateWinnersReportPdf.
 */
export function generateStudentResultsReportPdf(
  rows: StudentResultsReportRow[],
  mode: ReportMode,
  categoryLabels: Record<string, string>,
  filename: string,
): void {
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const columns = columnsForMode(mode, categoryLabels);
  let y = MARGIN_MM;

  function ensureSpace(next: number) {
    if (y + next > BOTTOM_LIMIT_MM) {
      pdf.addPage();
      y = MARGIN_MM;
    }
  }

  function drawTableHeader() {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(90);
    let x = MARGIN_MM;
    for (const column of columns) {
      pdf.text(column.header, x, y);
      x += column.width;
    }
    pdf.setTextColor(0);
    y += 2;
    pdf.setDrawColor(200);
    pdf.line(MARGIN_MM, y, PAGE_WIDTH_MM - MARGIN_MM, y);
    y += 5;
  }

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.text(MODE_TITLES[mode], MARGIN_MM, y);
  y += 7;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(110);
  pdf.text("Every published program's results, position-uncapped.", MARGIN_MM, y);
  pdf.setTextColor(0);
  y += 10;

  const sections = buildSections(rows, mode);

  if (sections.length === 0) {
    pdf.setFontSize(11);
    pdf.text("No published results yet.", MARGIN_MM, y);
    pdf.save(filename);
    return;
  }

  for (const section of sections) {
    ensureSpace(18);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    pdf.text(categoryLabels[section.title] ?? section.title, MARGIN_MM, y);
    y += 7;

    drawTableHeader();

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9.5);
    for (const row of section.rows) {
      ensureSpace(ROW_HEIGHT_MM);
      let x = MARGIN_MM;
      for (const column of columns) {
        const text = pdf.splitTextToSize(column.get(row), column.width - 2)[0] as string;
        pdf.text(text, x, y);
        x += column.width;
      }
      y += ROW_HEIGHT_MM;
    }

    y += 6;
  }

  pdf.save(filename);
}
