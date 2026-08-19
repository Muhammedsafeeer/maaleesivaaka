import { z } from "zod";
import { CRITERION_SCORE_MIN, CRITERION_SCORE_MAX } from "@/constants/scoring";

/** Bounds for a single scoring type (criterion) — every type is judged 0-10, per
 * supabase/migrations/20260801000000_program_scoring_criteria.sql. A program's total is
 * the sum across however many types it has, so there's no fixed bound on the total
 * itself; see scoring.service.ts, which recomputes it server-side from these. */
export const criterionScoreValueSchema = z.coerce
  .number({ error: "Enter a score." })
  .int("Score must be a whole number.")
  .min(CRITERION_SCORE_MIN, `Score must be between ${CRITERION_SCORE_MIN} and ${CRITERION_SCORE_MAX}.`)
  .max(CRITERION_SCORE_MAX, `Score must be between ${CRITERION_SCORE_MIN} and ${CRITERION_SCORE_MAX}.`);

export const submitScoresSchema = z.object({
  scores: z
    .array(
      z
        .object({
          student_id: z.uuid(),
          score: z.number().int().min(0),
          /** Present for programs with configured scoring types; the server ignores
           * `score` above and recomputes it as the sum of these (defense in depth —
           * scoring.service.ts's submitScores doesn't trust a client-computed total). */
          criteria_scores: z
            .array(
              z.object({
                criterion_id: z.string().min(1),
                score: criterionScoreValueSchema,
              }),
            )
            .optional(),
        })
        .refine(
          (entry) => (entry.criteria_scores && entry.criteria_scores.length > 0) || entry.score <= CRITERION_SCORE_MAX,
          {
            message: `Score must be between 0 and ${CRITERION_SCORE_MAX} when this program has no scoring types.`,
            path: ["score"],
          },
        ),
    )
    .min(1, "Enter at least one score before saving."),
});

export type SubmitScoresInput = z.infer<typeof submitScoresSchema>;

/** Team-scoped sibling of submitScoresSchema (D-025 follow-up) — a group program's
 * judge_scores rows are keyed by group_entry_id instead of student_id. */
export const submitTeamScoresSchema = z.object({
  scores: z
    .array(
      z
        .object({
          group_entry_id: z.uuid(),
          score: z.number().int().min(0),
          criteria_scores: z
            .array(
              z.object({
                criterion_id: z.string().min(1),
                score: criterionScoreValueSchema,
              }),
            )
            .optional(),
        })
        .refine(
          (entry) => (entry.criteria_scores && entry.criteria_scores.length > 0) || entry.score <= CRITERION_SCORE_MAX,
          {
            message: `Score must be between 0 and ${CRITERION_SCORE_MAX} when this program has no scoring types.`,
            path: ["score"],
          },
        ),
    )
    .min(1, "Enter at least one score before saving."),
});

export type SubmitTeamScoresInput = z.infer<typeof submitTeamScoresSchema>;

/**
 * Client-only. A scoring-form row's per-criterion input allows an empty string (not yet
 * scored — partial saves are expected, see scoring.service.ts) alongside a valid score,
 * so it can't reuse criterionScoreValueSchema's number type directly.
 */
export const criterionFieldSchema = z
  .string()
  .trim()
  .refine((value) => value === "" || criterionScoreValueSchema.safeParse(value).success, {
    message: `Score must be a whole number between ${CRITERION_SCORE_MIN} and ${CRITERION_SCORE_MAX}.`,
  });

/**
 * `criterion_id` is a real scoring_criteria.id for programs with configured types, or a
 * single client-only synthetic id (ScoringForm's effectiveCriteria fallback) for the
 * plain 0-10 case — never sent to the server as a real criterion in that case.
 */
export const scoringEntrySchema = z.object({
  student_id: z.uuid(),
  student_name: z.string(),
  criteriaScores: z
    .array(
      z.object({
        criterion_id: z.string(),
        value: criterionFieldSchema,
      }),
    )
    .min(1),
});

export const scoringFormSchema = z.object({
  entries: z.array(scoringEntrySchema),
});

export type ScoringFormInput = z.infer<typeof scoringFormSchema>;

/** Team-scoped sibling of scoringEntrySchema/scoringFormSchema — a group program's
 * form row is keyed by group_entry_id and labeled by house + chest number, not a
 * student's own name. */
export const teamScoringEntrySchema = z.object({
  group_entry_id: z.uuid(),
  group_name: z.string(),
  chest_number: z.string(),
  criteriaScores: z
    .array(
      z.object({
        criterion_id: z.string(),
        value: criterionFieldSchema,
      }),
    )
    .min(1),
});

export const teamScoringFormSchema = z.object({
  entries: z.array(teamScoringEntrySchema),
});

export type TeamScoringFormInput = z.infer<typeof teamScoringFormSchema>;
