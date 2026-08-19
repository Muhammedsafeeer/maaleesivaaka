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
import { Badge } from "@/components/ui/badge";
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
import {
  teamScoringFormSchema,
  type TeamScoringFormInput,
} from "@/features/scoring/validation/score.schema";
import { submitTeamScoresAction } from "@/features/scoring/actions/scoring.actions";
import type { ScorableTeam, TeamScoreInput } from "@/lib/services/scoring.service";
import type { ScoringCriterion } from "@/lib/services/scoringCriteria.service";
import { CRITERION_SCORE_MIN, CRITERION_SCORE_MAX, getMaxTotalScore } from "@/constants/scoring";

const DEFAULT_CRITERION: ScoringCriterion = { id: "__default__", name: "Score" };

/**
 * Team-scoped sibling of ScoringForm (D-025 follow-up): a group program is scored ONCE
 * per team entry, not once per member, so each row is a house + chest number rather
 * than a student's photo/name/roll — there is no per-student score to enter here.
 */
export function TeamScoringForm({
  programId,
  teams,
  criteria,
  canEdit,
}: {
  programId: string;
  teams: ScorableTeam[];
  criteria: ScoringCriterion[];
  canEdit: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const hasCriteria = criteria.length > 0;
  const effectiveCriteria = hasCriteria ? criteria : [DEFAULT_CRITERION];

  const [pendingScores, setPendingScores] = useState<TeamScoreInput[] | null>(null);
  const [overrideError, setOverrideError] = useState<string | null>(null);
  const [adminPassword, setAdminPassword] = useState("");

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<TeamScoringFormInput>({
    resolver: zodResolver(teamScoringFormSchema),
    defaultValues: {
      entries: teams.map((team) => ({
        group_entry_id: team.id,
        group_name: team.groupName,
        chest_number: team.chestNumber,
        criteriaScores: effectiveCriteria.map((criterion) => {
          if (!hasCriteria) {
            return {
              criterion_id: criterion.id,
              value: team.score !== null ? String(team.score) : "",
            };
          }
          const existing = team.criteriaScores.find((cs) => cs.criterion_id === criterion.id);
          return { criterion_id: criterion.id, value: existing ? String(existing.score) : "" };
        }),
      })),
    },
  });

  function buildScores(values: TeamScoringFormInput): TeamScoreInput[] {
    const scores: TeamScoreInput[] = [];

    for (const entry of values.entries) {
      const allFilled = entry.criteriaScores.every((cs) => cs.value !== "");
      if (!allFilled) continue;

      if (!hasCriteria) {
        scores.push({
          group_entry_id: entry.group_entry_id,
          score: Number(entry.criteriaScores[0].value),
        });
        continue;
      }

      const criteria_scores = entry.criteriaScores.map((cs) => ({
        criterion_id: cs.criterion_id,
        score: Number(cs.value),
      }));
      scores.push({
        group_entry_id: entry.group_entry_id,
        score: criteria_scores.reduce((sum, cs) => sum + cs.score, 0),
        criteria_scores,
      });
    }

    return scores;
  }

  function submit(scores: TeamScoreInput[], adminOverride?: { password: string }) {
    startTransition(async () => {
      const result = await submitTeamScoresAction(programId, { scores }, adminOverride);

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

  function onSubmit(values: TeamScoringFormInput) {
    const scores = buildScores(values);

    if (scores.length === 0) {
      toast.error(
        hasCriteria
          ? "Fill in every scoring type for at least one team before saving."
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
        {teams.map((team, index) => (
          <div key={team.id} className="flex items-center gap-3 p-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{team.groupName}</p>
              <Badge variant="secondary" className="mt-1 tabular-nums">
                Chest {team.chestNumber}
              </Badge>
            </div>

            {hasCriteria ? (
              <MultiCriterionInputs
                control={control}
                index={index}
                criteria={effectiveCriteria}
                teamName={team.groupName}
                canEdit={canEdit}
                isPending={isPending}
                register={register}
                errors={errors}
              />
            ) : (
              <div className="flex w-20 flex-col gap-1">
                <Label htmlFor={`team-score-${team.id}`} className="sr-only">
                  Score for {team.groupName}
                </Label>
                <Input
                  id={`team-score-${team.id}`}
                  type="number"
                  inputMode="numeric"
                  min={CRITERION_SCORE_MIN}
                  max={CRITERION_SCORE_MAX}
                  step={1}
                  disabled={!canEdit || isPending}
                  aria-invalid={
                    errors.entries?.[index]?.criteriaScores?.[0]?.value ? true : undefined
                  }
                  {...register(`entries.${index}.criteriaScores.0.value`)}
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
              This changes a score already submitted for at least one team. Have an
              admin enter their password to confirm the change.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="team-override-admin-password">Admin password</Label>
              <Input
                id="team-override-admin-password"
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

function MultiCriterionInputs({
  control,
  index,
  criteria,
  teamName,
  canEdit,
  isPending,
  register,
  errors,
}: {
  control: Control<TeamScoringFormInput>;
  index: number;
  criteria: ScoringCriterion[];
  teamName: string;
  canEdit: boolean;
  isPending: boolean;
  register: UseFormRegister<TeamScoringFormInput>;
  errors: FieldErrors<TeamScoringFormInput>;
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
              htmlFor={`team-score-${index}-${criterion.id}`}
              className="truncate text-xs text-muted-foreground"
            >
              {criterion.name}
            </Label>
            <Input
              id={`team-score-${index}-${criterion.id}`}
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
              {...register(`entries.${index}.criteriaScores.${criterionIndex}.value`)}
            />
          </div>
        ))}
      </div>
      <p className="text-right text-xs font-medium tabular-nums text-muted-foreground">
        Total for {teamName}: {total} / {max}
      </p>
    </div>
  );
}
