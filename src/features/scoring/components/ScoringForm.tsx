"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { PhotoThumbnail } from "@/components/tables/PhotoThumbnail";
import {
  scoringFormSchema,
  type ScoringFormInput,
} from "@/features/scoring/validation/score.schema";
import { submitScoresAction } from "@/features/scoring/actions/scoring.actions";
import type { ScorableStudent } from "@/lib/services/scoring.service";

/**
 * A row-list, not a Table — components/README.md: "Judges score on phones," and a
 * photo + name + class + score input row is cramped in a table's columns at phone
 * widths even with horizontal scroll. Rows without a score are skipped on submit
 * (scoring.service.ts's submitScores expects only the rows being set), so a judge can
 * score a few students, save, and come back later for the rest.
 */
export function ScoringForm({
  programId,
  students,
  canEdit,
}: {
  programId: string;
  students: ScorableStudent[];
  canEdit: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ScoringFormInput>({
    resolver: zodResolver(scoringFormSchema),
    defaultValues: {
      entries: students.map((student) => ({
        student_id: student.id,
        student_name: student.name,
        score: student.score !== null ? String(student.score) : "",
      })),
    },
  });

  function onSubmit(values: ScoringFormInput) {
    const scores = values.entries
      .filter((entry) => entry.score !== "")
      .map((entry) => ({ student_id: entry.student_id, score: Number(entry.score) }));

    if (scores.length === 0) {
      toast.error("Enter at least one score before saving.");
      return;
    }

    startTransition(async () => {
      const result = await submitScoresAction(programId, { scores });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Scores saved.");
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col divide-y divide-border rounded-lg border border-border">
        {students.map((student, index) => (
          <div key={student.id} className="flex items-center gap-3 p-3">
            <PhotoThumbnail url={student.photo_url} alt={`${student.name} photo`} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{student.name}</p>
              <p className="truncate text-xs text-muted-foreground tabular-nums">
                {student.roll_number} · {student.class}
              </p>
            </div>
            <div className="flex w-20 flex-col gap-1">
              <Label htmlFor={`score-${student.id}`} className="sr-only">
                Score for {student.name}
              </Label>
              <Input
                id={`score-${student.id}`}
                type="number"
                inputMode="numeric"
                min={0}
                max={100}
                step={1}
                disabled={!canEdit || isPending}
                aria-invalid={errors.entries?.[index]?.score ? true : undefined}
                {...register(`entries.${index}.score`)}
              />
              {errors.entries?.[index]?.score ? (
                <p role="alert" className="text-xs text-destructive">
                  {errors.entries[index]?.score?.message}
                </p>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {canEdit ? (
        <SubmitButton isPending={isPending} pendingText="Saving…" className="self-start">
          Save scores
        </SubmitButton>
      ) : null}
    </form>
  );
}
