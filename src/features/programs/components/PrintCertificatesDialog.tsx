"use client";

import { useState } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CertificatePrintPortal } from "@/features/certificates/components/CertificatePrintPortal";
import { CertificateTemplate } from "@/features/certificates/components/CertificateTemplate";
import type { listResults } from "@/lib/services/result.service";
import type { CertificateSettings } from "@/lib/services/certificateSettings.service";

type ResultRow = Awaited<ReturnType<typeof listResults>>[number];

const POSITION_LABELS: Record<number, string> = { 1: "1st", 2: "2nd", 3: "3rd" };

/**
 * Admin-side certificate printing for a single program's podium (positions 1–3): a
 * preview list of who's getting a certificate — name, roll number, class, house — before
 * anything is sent to the printer, then a "Print" that hands the same three students to
 * CertificatePrintPortal as one CertificateTemplate page each. Hidden entirely (returns
 * null) when the program has no podium yet, same guard the "Publish" button next to it
 * uses for "no results".
 */
export function PrintCertificatesDialog({
  results,
  programName,
  categoryLabel,
  certificateSettings,
}: {
  results: ResultRow[];
  programName: string;
  categoryLabel: string;
  certificateSettings: CertificateSettings;
}) {
  const [open, setOpen] = useState(false);
  const [printing, setPrinting] = useState(false);

  const podium = results
    .filter((result) => result.position <= 3 && result.students)
    .sort((a, b) => a.position - b.position);

  if (podium.length === 0) {
    return null;
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Printer className="size-4" aria-hidden="true" />
        Print Certificates
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Print Certificates — {programName}</DialogTitle>
          </DialogHeader>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Position</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>House</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {podium.map((result) => (
                <TableRow key={result.id}>
                  <TableCell>
                    <Badge>{POSITION_LABELS[result.position] ?? result.position}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {result.students?.name}{" "}
                    <span className="text-muted-foreground">({result.students?.roll_number})</span>
                  </TableCell>
                  <TableCell>{result.students?.class ?? "—"}</TableCell>
                  <TableCell>{result.students?.main_groups?.name ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <DialogFooter>
            <Button
              onClick={() => {
                // Close first — the CSS fallback (globals.css) already hides every
                // body-level portal while printing, but closing avoids this dialog's
                // focus trap fighting the print dialog for focus in some browsers.
                setOpen(false);
                setPrinting(true);
              }}
            >
              <Printer className="size-4" aria-hidden="true" />
              Print {podium.length} {podium.length === 1 ? "Certificate" : "Certificates"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CertificatePrintPortal open={printing} onClose={() => setPrinting(false)}>
        {podium.map((result) => (
          <CertificateTemplate
            key={result.id}
            studentName={result.students?.name ?? ""}
            studentMalayalamName={result.students?.malayalam_name}
            rollNumber={result.students?.roll_number}
            className={result.students?.class}
            houseName={result.students?.main_groups?.name}
            photoUrl={result.students?.photo_url}
            programName={programName}
            categoryLabel={categoryLabel}
            position={result.position}
            points={result.points}
            signatoryName={certificateSettings.signatoryName}
            sealUrl={certificateSettings.sealUrl}
            signatureUrl={certificateSettings.signatureUrl}
          />
        ))}
      </CertificatePrintPortal>
    </>
  );
}
