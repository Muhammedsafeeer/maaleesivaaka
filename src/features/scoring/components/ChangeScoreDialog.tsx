"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import type { VariantProps } from "class-variance-authority";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScoringForm } from "@/features/scoring/components/ScoringForm";
import { TeamScoringForm } from "@/features/scoring/components/TeamScoringForm";
import {
  getScoreMatrixAction,
  getJudgeScorableAction,
  adminSubmitScoresAction,
  adminSubmitTeamScoresAction,
  type ScoreMatrix,
  type JudgeScorable,
} from "@/features/scoring/actions/scoring.actions";
import { CRITERION_SCORE_MIN, CRITERION_SCORE_MAX, clampScoreInput } from "@/constants/scoring";
import { cn } from "@/lib/utils";

/**
 * Rescoring entry point for both the Fixture page (a tied program's red "Change score"
 * button) and the program detail page (the general "Rescore" button) — same dialog
 * either way, all judges shown side by side so fixing a tie doesn't mean navigating
 * away or guessing which judge to open first. Data loads lazily on open, not
 * pre-fetched by the caller.
 *
 * Two editing paths depending on the program's rubric:
 * - No configured scoring types (the common case): one plain score per judge, so every
 *   participant × judge cell is directly editable in a single table.
 * - Configured scoring types: a judge's number is a sum of several criteria, which
 *   can't fit in one table cell — picking a judge (shown in a row of buttons) instead
 *   loads that judge's full multi-criterion form (ScoringForm/TeamScoringForm in admin
 *   mode), one judge at a time.
 */
export function ChangeScoreDialog({
  programId,
  programName,
  triggerLabel = "Change score",
  triggerVariant = "destructive",
}: {
  programId: string;
  programName: string;
  triggerLabel?: string;
  triggerVariant?: VariantProps<typeof buttonVariants>["variant"];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [matrix, setMatrix] = useState<ScoreMatrix | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, Record<string, string>>>({});
  const [saving, setSaving] = useState(false);

  // Criteria path only: which judge's full form is showing, and its (lazily loaded)
  // scorable roster.
  const [selectedJudgeId, setSelectedJudgeId] = useState<string | null>(null);
  const [judgeScorable, setJudgeScorable] = useState<JudgeScorable | null>(null);
  const [loadingJudge, setLoadingJudge] = useState(false);

  function handleOpenChange(next: boolean) {
    setOpen(next);

    if (next && !matrix && !loading) {
      setLoading(true);
      setLoadError(null);
      getScoreMatrixAction(programId).then((result) => {
        setLoading(false);
        if (!result.success) {
          setLoadError(result.error);
          return;
        }
        setMatrix(result.data);
        const initial: Record<string, Record<string, string>> = {};
        for (const judge of result.data.judges) {
          initial[judge.id] = {};
          for (const row of result.data.rows) {
            initial[judge.id][row.id] = String(row.scores[judge.id] ?? 0);
          }
        }
        setValues(initial);
      });
    }

    if (!next) {
      // Reset so reopening re-fetches fresh data instead of showing a stale snapshot.
      setMatrix(null);
      setLoadError(null);
      setValues({});
      setSelectedJudgeId(null);
      setJudgeScorable(null);
    }
  }

  function selectJudge(judgeId: string) {
    setSelectedJudgeId(judgeId);
    setJudgeScorable(null);
    setLoadingJudge(true);
    getJudgeScorableAction(programId, judgeId).then((result) => {
      setLoadingJudge(false);
      if (!result.success) {
        toast.error(result.error);
        setSelectedJudgeId(null);
        return;
      }
      setJudgeScorable(result.data);
    });
  }

  async function handleSave() {
    if (!matrix) return;
    setSaving(true);

    const results = await Promise.all(
      matrix.judges.map((judge) => {
        if (matrix.isGroup) {
          const scores = matrix.rows.map((row) => ({
            group_entry_id: row.id,
            score: Number(values[judge.id]?.[row.id] ?? 0),
          }));
          return adminSubmitTeamScoresAction(programId, judge.id, { scores });
        }
        const scores = matrix.rows.map((row) => ({
          student_id: row.id,
          score: Number(values[judge.id]?.[row.id] ?? 0),
        }));
        return adminSubmitScoresAction(programId, judge.id, { scores });
      }),
    );

    setSaving(false);

    const firstError = results.find((result) => result.error)?.error;
    if (firstError) {
      toast.error(firstError);
      return;
    }

    toast.success("Scores saved and recalculated.");
    setOpen(false);
    setMatrix(null);
    router.refresh();
  }

  const orderedRows = matrix
    ? [...matrix.rows].sort((a, b) => Number(b.tied) - Number(a.tied))
    : [];
  const canEditHere = matrix
    ? !matrix.hasCriteria && matrix.rows.length > 0 && matrix.judges.length > 0
    : false;
  const tiedIds = new Set(matrix?.rows.filter((row) => row.tied).map((row) => row.id) ?? []);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant={triggerVariant} className="h-7 px-2 text-xs">
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{programName} — scores</DialogTitle>
          <DialogDescription>
            {matrix?.hasCriteria
              ? "Pick a judge to edit their scores."
              : "Tied participants are listed first. Edit any judge's score and save to recalculate positions."}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>
        ) : loadError ? (
          <p className="py-6 text-center text-sm text-destructive">{loadError}</p>
        ) : matrix ? (
          matrix.rows.length === 0 || matrix.judges.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nothing to score yet.
            </p>
          ) : matrix.hasCriteria ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-2">
                {matrix.judges.map((judge) => (
                  <Button
                    key={judge.id}
                    type="button"
                    size="sm"
                    variant={selectedJudgeId === judge.id ? "default" : "outline"}
                    onClick={() => selectJudge(judge.id)}
                  >
                    {judge.label} · {judge.name}
                  </Button>
                ))}
              </div>

              {loadingJudge ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>
              ) : selectedJudgeId && judgeScorable ? (
                judgeScorable.isGroup ? (
                  <TeamScoringForm
                    key={selectedJudgeId}
                    programId={programId}
                    teams={judgeScorable.teams}
                    criteria={judgeScorable.criteria}
                    canEdit
                    tiedIds={tiedIds}
                    adminJudgeId={selectedJudgeId}
                    sortTiedFirst
                  />
                ) : (
                  <ScoringForm
                    key={selectedJudgeId}
                    programId={programId}
                    students={judgeScorable.students}
                    criteria={judgeScorable.criteria}
                    canEdit
                    tiedIds={tiedIds}
                    adminJudgeId={selectedJudgeId}
                    sortTiedFirst
                  />
                )
              ) : null}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    {matrix.judges.map((judge) => (
                      <TableHead key={judge.id} className="w-20 text-center">
                        {judge.label}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderedRows.map((row) => (
                    <TableRow key={row.id} className={cn(row.tied && "bg-destructive/5")}>
                      <TableCell>
                        <p className="text-sm font-medium">
                          {row.name}
                          {row.tied ? (
                            <Badge variant="destructive" className="ml-1.5 align-middle text-[0.65rem]">
                              Tied
                            </Badge>
                          ) : null}
                        </p>
                        <p className="text-xs text-muted-foreground">{row.secondary}</p>
                      </TableCell>
                      {matrix.judges.map((judge) => (
                        <TableCell key={judge.id} className="text-center">
                          <Input
                            type="number"
                            inputMode="numeric"
                            min={CRITERION_SCORE_MIN}
                            max={CRITERION_SCORE_MAX}
                            step={1}
                            className="mx-auto h-8 w-16 text-center"
                            value={values[judge.id]?.[row.id] ?? "0"}
                            onChange={(event) => {
                              clampScoreInput(event);
                              const next = event.target.value;
                              setValues((current) => ({
                                ...current,
                                [judge.id]: { ...current[judge.id], [row.id]: next },
                              }));
                            }}
                            disabled={saving}
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )
        ) : null}

        {canEditHere ? (
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save & recalculate"}
            </Button>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
