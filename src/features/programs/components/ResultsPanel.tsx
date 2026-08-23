"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EmptyState } from "@/components/tables/EmptyState";
import {
  recalculateResultsAction,
  publishProgramAction,
} from "@/features/programs/actions/result.actions";
import { setProgramStatusAction } from "@/features/programs/actions/fixture.actions";
import { PrintCertificatesDialog } from "@/features/programs/components/PrintCertificatesDialog";
import type { listResults, listProgramPodiumForCertificates } from "@/lib/services/result.service";
import type { ScoringCriterion } from "@/lib/services/scoringCriteria.service";
import type { CertificateSettings } from "@/lib/services/certificateSettings.service";
import type { ProgramStatus } from "@/constants/programs";

type ResultRow = Awaited<ReturnType<typeof listResults>>[number];
type PodiumRow = Awaited<ReturnType<typeof listProgramPodiumForCertificates>>[number];
type CriterionAverage = { criterion_id: string; average: number };

export function ResultsPanel({
  programId,
  programName,
  categoryLabel,
  status,
  results,
  podiumRows,
  criteria,
  certificateSettings,
}: {
  programId: string;
  programName: string;
  categoryLabel: string;
  status: ProgramStatus;
  results: ResultRow[];
  podiumRows: PodiumRow[];
  criteria: ScoringCriterion[];
  certificateSettings: CertificateSettings;
}) {
  const [isRecalculating, startRecalculate] = useTransition();
  const [isPublishing, startPublish] = useTransition();
  const [isAcceptingTie, startAcceptTie] = useTransition();
  const [isUnpublishing, startUnpublish] = useTransition();
  // Which recovery path the confirmation dialog is currently open for — null when
  // closed. A separate dialog per target rather than one generic one, since "reopen
  // for rescoring" and "reset to upcoming" have very different consequences worth
  // spelling out on their own.
  const [unpublishTarget, setUnpublishTarget] = useState<"scoring" | "upcoming" | null>(null);

  // Derived, never stored (D-002 precedent) — the same duplicate-position check
  // finalize_program_results (SQL) already used to decide not to auto-complete this
  // program. status === "scoring" with results already populated only happens this
  // way (a fully-scored, still-open program) once a tie blocked the normal
  // scoring -> completed transition.
  const tiedPositions = new Map<number, typeof results>();
  for (const result of results) {
    const list = tiedPositions.get(result.position) ?? [];
    list.push(result);
    tiedPositions.set(result.position, list);
  }
  const ties = Array.from(tiedPositions.values()).filter((group) => group.length > 1);
  const hasUnresolvedTie = status === "scoring" && ties.length > 0;

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

  function handleUnpublish() {
    if (!unpublishTarget) return;
    const target = unpublishTarget;
    startUnpublish(async () => {
      const result = await setProgramStatusAction(programId, target);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setUnpublishTarget(null);
      toast.success(
        target === "scoring"
          ? "Reopened for scoring — pulled from the audience view."
          : "Reset to upcoming — pulled from the audience view.",
      );
    });
  }

  function handleAcceptTie() {
    startAcceptTie(async () => {
      const result = await setProgramStatusAction(programId, "completed");
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Tie accepted — results finalized as-is.");
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
            podiumRows={podiumRows}
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
          {status === "published" ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUnpublishTarget("scoring")}
                disabled={isUnpublishing}
              >
                Reopen for rescoring
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUnpublishTarget("upcoming")}
                disabled={isUnpublishing}
              >
                Reset to upcoming
              </Button>
            </>
          ) : null}
        </div>
      </div>

      <AlertDialog
        open={unpublishTarget !== null}
        onOpenChange={(open) => {
          if (!open) setUnpublishTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {unpublishTarget === "scoring" ? "Reopen for rescoring?" : "Reset to upcoming?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {unpublishTarget === "scoring"
                ? `${programName} will be pulled from the audience view immediately and its judge can revise scores again. Recalculate and publish again once you're ready.`
                : `${programName} will be pulled from the audience view immediately and moved back to Upcoming, as if it hadn't started — its calculated results stay on record but won't show anywhere until it's finalized and published again.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUnpublishing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                handleUnpublish();
              }}
              disabled={isUnpublishing}
            >
              {isUnpublishing ? "Working…" : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {hasUnresolvedTie ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
            <p className="text-sm text-destructive">
              Scoring is complete, but {ties.length === 1 ? "a position is" : "positions are"} tied
              — held back from finalizing. Ask the judge to revise a score, or accept the
              tie to finalize it as-is (tied participants share the position and both
              get full points).
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={handleAcceptTie} disabled={isAcceptingTie}>
            {isAcceptingTie ? "Accepting…" : "Accept tie & finalize"}
          </Button>
        </div>
      ) : null}

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
              <TableHead>Participant</TableHead>
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

              const isTied = (tiedPositions.get(result.position)?.length ?? 0) > 1;

              return (
                <TableRow key={result.id} className={isTied ? "bg-destructive/5" : undefined}>
                  <TableCell>
                    <span className="flex items-center gap-1.5">
                      <Badge variant={result.position <= 3 ? "default" : "outline"}>
                        {result.position}
                      </Badge>
                      {isTied ? <Badge variant="destructive">Tied</Badge> : null}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">
                    {result.students ? (
                      <>
                        {result.students.name}{" "}
                        <span className="text-muted-foreground">
                          ({result.students.roll_number})
                        </span>
                      </>
                    ) : result.program_group_entries ? (
                      <>
                        {result.program_group_entries.main_groups?.name ?? "Unknown house"}{" "}
                        <span className="text-muted-foreground tabular-nums">
                          (Chest {result.program_group_entries.chest_number})
                        </span>
                      </>
                    ) : (
                      "—"
                    )}
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
