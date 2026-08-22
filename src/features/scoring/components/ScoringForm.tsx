"use client";

import { useState, useTransition } from "react";
import {
  useForm,
  useWatch,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { PhotoThumbnail } from "@/components/tables/PhotoThumbnail";
import {
  scoringFormSchema,
  type ScoringFormInput,
} from "@/features/scoring/validation/score.schema";
import { submitScoresAction } from "@/features/scoring/actions/scoring.actions";
import type { ScorableStudent, ScoreInput } from "@/lib/services/scoring.service";
import type { ScoringCriterion } from "@/lib/services/scoringCriteria.service";
import { CRITERION_SCORE_MIN, CRITERION_SCORE_MAX, getMaxTotalScore, clampScoreInput } from "@/constants/scoring";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const DEFAULT_CRITERION: ScoringCriterion = { id: "__default__", name: "Score" };

/**
 * A row-list, not a Table — components/README.md: "Judges score on phones," and a
 * photo + name + class + score input row is cramped in a table's columns at phone
 * widths even with horizontal scroll. Rows without every criterion filled in are
 * skipped on submit (scoring.service.ts's submitScores expects only the rows actually
 * being set), so a judge can score a few students, save, and come back later.
 */
export function ScoringForm({
  programId,
  students,
  criteria,
  canEdit,
  tiedIds,
}: {
  programId: string;
  students: ScorableStudent[];
  criteria: ScoringCriterion[];
  canEdit: boolean;
  /** student ids currently tied with someone else (TiedPositionsBanner above already
   * names them) — highlighted here so they're easy to find in a long roster. */
  tiedIds?: Set<string>;
}) {
  const [isPending, startTransition] = useTransition();
  const hasCriteria = criteria.length > 0;
  const effectiveCriteria = hasCriteria ? criteria : [DEFAULT_CRITERION];

  // Set when a submission comes back needing an admin's OK — the judge is changing a
  // score already saved for that student, not setting one for the first time (see
  // scoring.service.ts's submitScores). Holds the scores so "Authorize" can resubmit
  // the exact same batch once credentials are entered.
  const [pendingScores, setPendingScores] = useState<ScoreInput[] | null>(null);
  const [overrideError, setOverrideError] = useState<string | null>(null);
  const [adminPassword, setAdminPassword] = useState("");

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ScoringFormInput>({
    resolver: zodResolver(scoringFormSchema),
    defaultValues: {
      entries: students.map((student) => ({
        student_id: student.id,
        student_name: student.name,
        criteriaScores: effectiveCriteria.map((criterion) => {
          if (!hasCriteria) {
            return {
              criterion_id: criterion.id,
              value: student.score !== null ? String(student.score) : "",
            };
          }
          const existing = student.criteriaScores.find(
            (cs) => cs.criterion_id === criterion.id,
          );
          return { criterion_id: criterion.id, value: existing ? String(existing.score) : "" };
        }),
      })),
    },
  });

  function buildScores(values: ScoringFormInput): ScoreInput[] {
    const scores: ScoreInput[] = [];

    for (const entry of values.entries) {
      const allFilled = entry.criteriaScores.every((cs) => cs.value !== "");
      if (!allFilled) continue;

      if (!hasCriteria) {
        scores.push({ student_id: entry.student_id, score: Number(entry.criteriaScores[0].value) });
        continue;
      }

      const criteria_scores = entry.criteriaScores.map((cs) => ({
        criterion_id: cs.criterion_id,
        score: Number(cs.value),
      }));
      scores.push({
        student_id: entry.student_id,
        score: criteria_scores.reduce((sum, cs) => sum + cs.score, 0),
        criteria_scores,
      });
    }

    return scores;
  }

  function submit(scores: ScoreInput[], adminOverride?: { password: string }) {
    startTransition(async () => {
      const result = await submitScoresAction(programId, { scores }, adminOverride);

      if (result.error) {
        if (result.requiresAdminOverride) {
          setPendingScores(scores);
          setOverrideError(adminOverride ? result.error : null);
          return;
        }
        toast.error(result.error);
        return;
      }

      setPendingScores(null);
      setOverrideError(null);
      setAdminPassword("");
      toast.success("Scores saved.");
    });
  }

  function onSubmit(values: ScoringFormInput) {
    const scores = buildScores(values);

    if (scores.length === 0) {
      toast.error(
        hasCriteria
          ? "Fill in every scoring type for at least one student before saving."
          : "Enter at least one score before saving.",
      );
      return;
    }

    submit(scores);
  }

  function handleAuthorize() {
    if (!pendingScores) return;
    submit(pendingScores, { password: adminPassword });
  }

  function closeOverrideDialog() {
    setPendingScores(null);
    setOverrideError(null);
    setAdminPassword("");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col divide-y divide-border rounded-lg border border-border">
        {students.map((student, index) => (
          <div
            key={student.id}
            className={cn(
              "flex items-center gap-3 p-3",
              tiedIds?.has(student.id) && "bg-destructive/5",
            )}
          >
            <PhotoThumbnail url={student.photo_url} alt={`${student.name} photo`} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {student.name}
                {tiedIds?.has(student.id) ? (
                  <Badge variant="destructive" className="ml-1.5 align-middle text-[0.65rem]">
                    Tied
                  </Badge>
                ) : null}
              </p>
              <p className="truncate text-xs text-muted-foreground tabular-nums">
                {student.roll_number} · {student.class}
              </p>
            </div>

            {hasCriteria ? (
              <MultiCriterionInputs
                control={control}
                index={index}
                criteria={effectiveCriteria}
                studentName={student.name}
                canEdit={canEdit}
                isPending={isPending}
                register={register}
                errors={errors}
              />
            ) : (
              <div className="flex w-20 flex-col gap-1">
                <Label htmlFor={`score-${student.id}`} className="sr-only">
                  Score for {student.name}
                </Label>
                <Input
                  id={`score-${student.id}`}
                  type="number"
                  inputMode="numeric"
                  min={CRITERION_SCORE_MIN}
                  max={CRITERION_SCORE_MAX}
                  step={1}
                  disabled={!canEdit || isPending}
                  aria-invalid={
                    errors.entries?.[index]?.criteriaScores?.[0]?.value ? true : undefined
                  }
                  {...register(`entries.${index}.criteriaScores.0.value`, { onChange: clampScoreInput })}
                />
                {errors.entries?.[index]?.criteriaScores?.[0]?.value ? (
                  <p role="alert" className="text-xs text-destructive">
                    {errors.entries[index]?.criteriaScores?.[0]?.value?.message}
                  </p>
                ) : null}
              </div>
            )}
          </div>
        ))}
      </div>

      {canEdit ? (
        <SubmitButton isPending={isPending} pendingText="Saving…" className="self-start">
          Save scores
        </SubmitButton>
      ) : null}

      <Dialog
        open={pendingScores !== null}
        onOpenChange={(open) => {
          if (!open) closeOverrideDialog();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Admin authorization required</DialogTitle>
            <DialogDescription>
              This changes a score already submitted for at least one student. Have an
              admin enter their password to confirm the change.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="override-admin-password">Admin password</Label>
              <Input
                id="override-admin-password"
                type="password"
                autoComplete="off"
                autoFocus
                value={adminPassword}
                onChange={(event) => setAdminPassword(event.target.value)}
                disabled={isPending}
              />
            </div>
            {overrideError ? (
              <p role="alert" className="text-sm text-destructive">
                {overrideError}
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeOverrideDialog} disabled={isPending}>
              Cancel
            </Button>
            <Button type="button" onClick={handleAuthorize} disabled={isPending || !adminPassword}>
              {isPending ? "Checking…" : "Authorize"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
}

/**
 * Stacked mini-inputs (one per scoring type) plus a live-computed total — split out so
 * only this row's total re-renders on keystroke (useWatch scoped to its own field path),
 * not the whole student list.
 */
function MultiCriterionInputs({
  control,
  index,
  criteria,
  studentName,
  canEdit,
  isPending,
  register,
  errors,
}: {
  control: Control<ScoringFormInput>;
  index: number;
  criteria: ScoringCriterion[];
  studentName: string;
  canEdit: boolean;
  isPending: boolean;
  register: UseFormRegister<ScoringFormInput>;
  errors: FieldErrors<ScoringFormInput>;
}) {
  const watchedScores = useWatch({ control, name: `entries.${index}.criteriaScores` });
  const total = (watchedScores ?? []).reduce((sum, cs) => {
    const n = Number(cs?.value);
    return sum + (Number.isFinite(n) ? n : 0);
  }, 0);
  const max = getMaxTotalScore(criteria.length);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap justify-end gap-2">
        {criteria.map((criterion, criterionIndex) => (
          <div key={criterion.id} className="flex w-20 flex-col gap-1">
            <Label
              htmlFor={`score-${index}-${criterion.id}`}
              className="truncate text-xs text-muted-foreground"
            >
              {criterion.name}
            </Label>
            <Input
              id={`score-${index}-${criterion.id}`}
              type="number"
              inputMode="numeric"
              min={CRITERION_SCORE_MIN}
              max={CRITERION_SCORE_MAX}
              step={1}
              disabled={!canEdit || isPending}
              aria-invalid={
                errors.entries?.[index]?.criteriaScores?.[criterionIndex]?.value
                  ? true
                  : undefined
              }
              {...register(`entries.${index}.criteriaScores.${criterionIndex}.value`, {
                onChange: clampScoreInput,
              })}
            />
          </div>
        ))}
      </div>
      <p className="text-right text-xs font-medium tabular-nums text-muted-foreground">
        Total for {studentName}: {total} / {max}
      </p>
    </div>
  );
}
