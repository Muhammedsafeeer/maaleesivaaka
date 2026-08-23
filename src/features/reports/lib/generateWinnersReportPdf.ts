import { jsPDF } from "jspdf";
import type { WinnersReportGroup } from "@/lib/services/result.service";

// A4 portrait — this is a text report (not a graphic poster/certificate), so unlike
// generateCertificatePdf.ts/generateGroupQrPdf.ts it draws directly with jsPDF's text
// API rather than capturing a DOM node with html2canvas: the report's length is
// unbounded (depends on how many houses/programs exist), and jsPDF's own y-cursor +
// addPage() pagination handles that naturally, where a fixed-size canvas capture
// wouldn't.
const PAGE_WIDTH_MM = 210;
const PAGE_HEIGHT_MM = 297;
const MARGIN_MM = 16;
const CONTENT_WIDTH_MM = PAGE_WIDTH_MM - MARGIN_MM * 2;
const BOTTOM_LIMIT_MM = PAGE_HEIGHT_MM - MARGIN_MM;
const ROW_LINE_HEIGHT_MM = 5.6;

const POSITION_LABELS: Record<number, string> = { 1: "1st", 2: "2nd", 3: "3rd" };

/**
 * Renders the house-wise winners report (published programs' top-3, grouped by house —
 * see result.service.ts's listWinnersReportByGroup) straight to a multi-page PDF and
 * triggers a browser download. A program with no 3rd result (e.g. only two students/
 * teams were scored) simply has no 3rd row here — `groups[].entries` only ever
 * contains rows that actually exist in `results`, nothing padded in to fill a slot.
 */
export function generateWinnersReportPdf(
  groups: WinnersReportGroup[],
  categoryLabels: Record<string, string>,
  filename: string,
): void {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  let y = MARGIN_MM;

  function ensureSpace(next: number) {
    if (y + next > BOTTOM_LIMIT_MM) {
      pdf.addPage();
      y = MARGIN_MM;
    }
  }

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.text("Winners Report", MARGIN_MM, y);
  y += 7;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(110);
  pdf.text("Every published program's top-3 finish, grouped by house.", MARGIN_MM, y);
  pdf.setTextColor(0);
  y += 10;

  if (groups.length === 0) {
    pdf.setFontSize(11);
    pdf.text("No published results yet.", MARGIN_MM, y);
    pdf.save(filename);
    return;
  }

  for (const group of groups) {
    ensureSpace(18);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    pdf.text(group.groupName, MARGIN_MM, y);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(110);
    pdf.text(`${group.totalPoints} pts total`, PAGE_WIDTH_MM - MARGIN_MM, y, { align: "right" });
    pdf.setTextColor(0);
    y += 3;
    pdf.setDrawColor(200);
    pdf.line(MARGIN_MM, y, PAGE_WIDTH_MM - MARGIN_MM, y);
    y += 6;

    for (const entry of group.entries) {
      const label = POSITION_LABELS[entry.position] ?? `#${entry.position}`;
      const categoryLabel = categoryLabels[entry.programCategory] ?? entry.programCategory;
      const wrapped = pdf.splitTextToSize(
        `${entry.programName} — ${categoryLabel}`,
        CONTENT_WIDTH_MM - 16 - 22,
      ) as string[];
      const rowHeight = ROW_LINE_HEIGHT_MM * wrapped.length;
      ensureSpace(rowHeight);

      pdf.setFontSize(10.5);
      pdf.setFont("helvetica", "bold");
      pdf.text(label, MARGIN_MM, y);
      pdf.setFont("helvetica", "normal");
      pdf.text(wrapped, MARGIN_MM + 16, y);
      pdf.text(`${entry.points} pts`, PAGE_WIDTH_MM - MARGIN_MM, y, { align: "right" });
      y += rowHeight;
    }

    y += 7;
  }

  pdf.save(filename);
}
