"use client";

import { useMemo, useState } from "react";
import { Printer } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/tables/EmptyState";
import { CertificatePrintPortal } from "@/features/certificates/components/CertificatePrintPortal";
import { CertificateTemplate } from "@/features/certificates/components/CertificateTemplate";
import type { PodiumCertificateRow } from "@/lib/services/result.service";
import type { CertificateSettings } from "@/lib/services/certificateSettings.service";

const POSITION_LABELS: Record<number, string> = { 1: "1st", 2: "2nd", 3: "3rd" };

type CertificateType = "position" | "participation";

type CertificateJobEntry = {
  studentName: string;
  rollNumber: string;
  className: string;
  houseName: string | null;
  photoUrl: string | null;
  programName: string;
  categoryLabel: string;
  position: number;
  points: number;
  certificateType: CertificateType;
};

function byPosition(a: PodiumCertificateRow, b: PodiumCertificateRow) {
  return a.position - b.position;
}

function groupByStudent(rows: PodiumCertificateRow[]) {
  const map = new Map<
    string,
    {
      studentId: string;
      studentName: string;
      rollNumber: string;
      className: string;
      houseName: string | null;
      wins: PodiumCertificateRow[];
    }
  >();
  for (const row of rows) {
    const entry = map.get(row.studentId) ?? {
      studentId: row.studentId,
      studentName: row.studentName,
      rollNumber: row.rollNumber,
      className: row.className,
      houseName: row.houseName,
      wins: [],
    };
    entry.wins.push(row);
    map.set(row.studentId, entry);
  }
  return Array.from(map.values()).sort((a, b) => a.studentName.localeCompare(b.studentName));
}

function groupByProgram(rows: PodiumCertificateRow[]) {
  const map = new Map<
    string,
    { programId: string; programName: string; programCategory: string; wins: PodiumCertificateRow[] }
  >();
  for (const row of rows) {
    const entry = map.get(row.programId) ?? {
      programId: row.programId,
      programName: row.programName,
      programCategory: row.programCategory,
      wins: [],
    };
    entry.wins.push(row);
    map.set(row.programId, entry);
  }
  return Array.from(map.values()).sort((a, b) => a.programName.localeCompare(b.programName));
}

/**
 * Three views, two data sets: "By Student" and "By Program" group podiumRows
 * (listPodiumResultsForCertificates, position 1–3 only) exactly as before.
 * "Participation" groups allRows (listAllResultsForCertificates, position-uncapped)
 * by student — every student who was scored gets a row here, podium or not,
 * confirmed with the user that a podium finisher can hold both a position
 * certificate and a participation one. All three funnel into the same
 * CertificatePrintPortal, one job at a time, tagged with the certificateType that
 * produced it so CertificateTemplate knows whether to print the position ribbon or
 * the "PARTICIPATE" one.
 */
export function CertificatesBrowser({
  podiumRows,
  allRows,
  categoryLabels,
  certificateSettings,
}: {
  podiumRows: PodiumCertificateRow[];
  allRows: PodiumCertificateRow[];
  categoryLabels: Record<string, string>;
  certificateSettings: CertificateSettings;
}) {
  const [job, setJob] = useState<CertificateJobEntry[] | null>(null);

  const byStudent = useMemo(() => groupByStudent(podiumRows), [podiumRows]);
  const byProgram = useMemo(() => groupByProgram(podiumRows), [podiumRows]);
  const byStudentParticipation = useMemo(() => groupByStudent(allRows), [allRows]);

  function toJob(
    wins: PodiumCertificateRow[],
    certificateType: CertificateType,
  ): CertificateJobEntry[] {
    return wins
      .slice()
      .sort(byPosition)
      .map((win) => ({
        studentName: win.studentName,
        rollNumber: win.rollNumber,
        className: win.className,
        houseName: win.houseName,
        photoUrl: win.photoUrl,
        programName: win.programName,
        categoryLabel: categoryLabels[win.programCategory] ?? win.programCategory,
        position: win.position,
        points: win.points,
        certificateType,
      }));
  }

  if (podiumRows.length === 0 && allRows.length === 0) {
    return (
      <EmptyState
        title="No certificates yet"
        description="Certificates appear here once a program has calculated results."
      />
    );
  }

  return (
    <>
      <Tabs defaultValue="student">
        <TabsList>
          <TabsTrigger value="student">By Student</TabsTrigger>
          <TabsTrigger value="program">By Program</TabsTrigger>
          <TabsTrigger value="participation">Participation Certificate</TabsTrigger>
        </TabsList>

        <TabsContent value="student">
          {byStudent.length === 0 ? (
            <EmptyState
              title="No podium certificates yet"
              description="Certificates appear here once a program has calculated podium (1st–3rd) results."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>House</TableHead>
                  <TableHead>Winning Programs</TableHead>
                  <TableHead className="text-right">Print</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byStudent.map((student) => (
                  <TableRow key={student.studentId}>
                    <TableCell className="font-medium whitespace-nowrap">
                      {student.studentName}{" "}
                      <span className="text-muted-foreground">({student.rollNumber})</span>
                    </TableCell>
                    <TableCell>{student.className}</TableCell>
                    <TableCell>{student.houseName ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {student.wins
                          .slice()
                          .sort(byPosition)
                          .map((win) => (
                            <span
                              key={win.id}
                              className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 py-0.5 pr-1 pl-2 text-xs"
                            >
                              <Badge className="h-4 px-1 text-[0.65rem]">
                                {POSITION_LABELS[win.position] ?? win.position}
                              </Badge>
                              {win.programName}
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="size-5"
                                aria-label={`Print certificate — ${student.studentName}, ${win.programName}`}
                                onClick={() => setJob(toJob([win], "position"))}
                              >
                                <Printer className="size-3" aria-hidden="true" />
                              </Button>
                            </span>
                          ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setJob(toJob(student.wins, "position"))}
                      >
                        <Printer className="size-4" aria-hidden="true" />
                        Print All ({student.wins.length})
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="program">
          {byProgram.length === 0 ? (
            <EmptyState
              title="No podium certificates yet"
              description="Certificates appear here once a program has calculated podium (1st–3rd) results."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Program</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Podium</TableHead>
                  <TableHead className="text-right">Print</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byProgram.map((program) => (
                  <TableRow key={program.programId}>
                    <TableCell className="font-medium whitespace-nowrap">{program.programName}</TableCell>
                    <TableCell>
                      {categoryLabels[program.programCategory] ?? program.programCategory}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {program.wins
                          .slice()
                          .sort(byPosition)
                          .map((win) => (
                            <span
                              key={win.id}
                              className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2 py-0.5 text-xs"
                            >
                              <Badge className="h-4 px-1 text-[0.65rem]">
                                {POSITION_LABELS[win.position] ?? win.position}
                              </Badge>
                              {win.studentName}
                            </span>
                          ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setJob(toJob(program.wins, "position"))}
                      >
                        <Printer className="size-4" aria-hidden="true" />
                        {program.wins.length === 1
                          ? "Print Certificate"
                          : `Print All (${program.wins.length})`}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="participation">
          {byStudentParticipation.length === 0 ? (
            <EmptyState
              title="No participation certificates yet"
              description="Certificates appear here once a program has calculated results."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>House</TableHead>
                  <TableHead>Programs</TableHead>
                  <TableHead className="text-right">Print</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byStudentParticipation.map((student) => (
                  <TableRow key={student.studentId}>
                    <TableCell className="font-medium whitespace-nowrap">
                      {student.studentName}{" "}
                      <span className="text-muted-foreground">({student.rollNumber})</span>
                    </TableCell>
                    <TableCell>{student.className}</TableCell>
                    <TableCell>{student.houseName ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {student.wins
                          .slice()
                          .sort(byPosition)
                          .map((win) => (
                            <span
                              key={win.id}
                              className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 py-0.5 pr-1 pl-2 text-xs"
                            >
                              <Badge variant="secondary" className="h-4 px-1 text-[0.65rem]">
                                {POSITION_LABELS[win.position] ?? win.position}
                              </Badge>
                              {win.programName}
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="size-5"
                                aria-label={`Print participation certificate — ${student.studentName}, ${win.programName}`}
                                onClick={() => setJob(toJob([win], "participation"))}
                              >
                                <Printer className="size-3" aria-hidden="true" />
                              </Button>
                            </span>
                          ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setJob(toJob(student.wins, "participation"))}
                      >
                        <Printer className="size-4" aria-hidden="true" />
                        Print All ({student.wins.length})
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>

      <CertificatePrintPortal open={job !== null} onClose={() => setJob(null)}>
        {job?.map((entry, index) => (
          <CertificateTemplate
            key={index}
            {...entry}
            signatoryName={certificateSettings.signatoryName}
            sealUrl={certificateSettings.sealUrl}
            signatureUrl={certificateSettings.signatureUrl}
          />
        ))}
      </CertificatePrintPortal>
    </>
  );
}
