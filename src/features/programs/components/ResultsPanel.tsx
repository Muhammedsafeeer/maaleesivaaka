"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/tables/EmptyState";
import {
  recalculateResultsAction,
  publishProgramAction,
} from "@/features/programs/actions/result.actions";
import { PrintCertificatesDialog } from "@/features/programs/components/PrintCertificatesDialog";
import type { listResults } from "@/lib/services/result.service";
import type { ScoringCriterion } from "@/lib/services/scoringCriteria.service";
import type { CertificateSettings } from "@/lib/services/certificateSettings.service";
import type { ProgramStatus } from "@/constants/programs";

type ResultRow = Awaited<ReturnType<typeof listResults>>[number];
type CriterionAverage = { criterion_id: string; average: number };

export function ResultsPanel({
  programId,
  programName,
  categoryLabel,
  status,
  results,
  criteria,
  certificateSettings,
}: {
  programId: string;
  programName: string;
  categoryLabel: string;
  status: ProgramStatus;
  results: ResultRow[];
  criteria: ScoringCriterion[];
  certificateSettings: CertificateSettings;
}) {
  const [isRecalculating, startRecalculate] = useTransition();
  const [isPublishing, startPublish] = useTransition();

  function handleRecalculate() {
    startRecalculate(async () => {
      const result = await recalculateResultsAction(programId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Results recalculated.");
    });
  }

  function handlePublish() {
    startPublish(async () => {
      const result = await publishProgramAction(programId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Results published — visible to the audience now.");
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-medium">Results</h2>
          <p className="text-sm text-muted-foreground">
            {status === "published"
              ? "Published — visible to the audience."
              : status === "completed"
                ? "Calculated. Review before publishing."
                : "Calculated automatically once every assigned judge finishes scoring."}
          </p>
        </div>
        <div className="flex gap-2">
          <PrintCertificatesDialog
            results={results}
            programName={programName}
            categoryLabel={categoryLabel}
            certificateSettings={certificateSettings}
          />
          {status === "scoring" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRecalculate}
              disabled={isRecalculating}
            >
              {isRecalculating ? "Checking…" : "Recalculate"}
            </Button>
          ) : null}
          {status === "completed" ? (
            <Button size="sm" onClick={handlePublish} disabled={isPublishing}>
              {isPublishing ? "Publishing…" : "Publish results"}
            </Button>
          ) : null}
        </div>
      </div>

      {results.length === 0 ? (
        <EmptyState
          title="No results yet"
          description="Results appear here once every assigned judge has scored every assigned student."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Position</TableHead>
              <TableHead>Student</TableHead>
              {criteria.map((criterion) => (
                <TableHead key={criterion.id} className="text-right">
                  {criterion.name}
                </TableHead>
              ))}
              <TableHead>Average</TableHead>
              <TableHead>Points</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((result) => {
              const criteriaAverages = (result.criteria_averages as CriterionAverage[] | null) ?? [];
              const averageByCriterion = new Map(
                criteriaAverages.map((c) => [c.criterion_id, c.average]),
              );

              return (
                <TableRow key={result.id}>
                  <TableCell>
                    <Badge variant={result.position <= 3 ? "default" : "outline"}>
                      {result.position}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {result.students?.name ?? "—"}{" "}
                    <span className="text-muted-foreground">
                      ({result.students?.roll_number ?? "—"})
                    </span>
                  </TableCell>
                  {criteria.map((criterion) => (
                    <TableCell key={criterion.id} className="text-right tabular-nums">
                      {averageByCriterion.get(criterion.id) ?? "—"}
                    </TableCell>
                  ))}
                  <TableCell className="tabular-nums">{result.average_score}</TableCell>
                  <TableCell className="tabular-nums">{result.points}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
