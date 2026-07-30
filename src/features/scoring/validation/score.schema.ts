import { z } from "zod";

/** Score bounds, per docs/project.md "Judges submit a total score (0–100) for each
 * student" and the judge_scores.score CHECK constraint (Phase 5). */
export const scoreValueSchema = z.coerce
  .number({ error: "Enter a score." })
  .int("Score must be a whole number.")
  .min(0, "Score must be between 0 and 100.")
  .max(100, "Score must be between 0 and 100.");

export const submitScoresSchema = z.object({
  scores: z
    .array(
      z.object({
        student_id: z.uuid(),
        score: scoreValueSchema,
      }),
    )
    .min(1, "Enter at least one score before saving."),
});

export type SubmitScoresInput = z.infer<typeof submitScoresSchema>;

/**
 * Client-only. The scoring form's per-row input allows an empty string (not yet
 * scored — partial saves are expected, see scoring.service.ts) alongside a valid
 * score, so it can't reuse submitScoresSchema's number type directly — that schema
 * requires every row to already have a value. Reuses scoreValueSchema for the actual
 * bounds check rather than repeating 0–100 here.
 */
export const scoreFieldSchema = z
  .string()
  .trim()
  .refine((value) => value === "" || scoreValueSchema.safeParse(value).success, {
    message: "Score must be a whole number between 0 and 100.",
  });

export const scoringEntrySchema = z.object({
  student_id: z.uuid(),
  student_name: z.string(),
  score: scoreFieldSchema,
});

export const scoringFormSchema = z.object({
  entries: z.array(scoringEntrySchema),
});

export type ScoringFormInput = z.infer<typeof scoringFormSchema>;
