import { z } from "zod";
import {
  CATEGORIES,
  STAGE_TYPES,
  PARTICIPATION_TYPES,
  type Category,
  type StageType,
  type ParticipationType,
} from "@/constants/programs";

const categoryValues = CATEGORIES.map((c) => c.value) as [Category, ...Category[]];
const stageTypeValues = STAGE_TYPES.map((s) => s.value) as [StageType, ...StageType[]];
const participationTypeValues = PARTICIPATION_TYPES.map((p) => p.value) as [
  ParticipationType,
  ...ParticipationType[],
];

/**
 * Shared by the create/edit dialog's zodResolver and the Server Action's
 * re-validation. No `status` field here on purpose (Phase 17): status is fully
 * system-managed by the fixture/scoring pipeline (draft -> upcoming on serial-number
 * assignment -> scoring on fixture start -> completed on full scoring -> published on
 * admin publish) — a free-form status editor here could skip stages or clobber
 * whatever the pipeline just set.
 */
export const programSchema = z.object({
  name: z.string().min(1, "Name is required.").max(200),
  malayalamName: z
    .string()
    .max(200, "Malayalam name must be 200 characters or fewer.")
    .optional(),
  stage_type: z.enum(stageTypeValues, { error: "Select a stage type." }),
  category: z.enum(categoryValues, { error: "Select a category." }),
  /** Named scoring types (e.g. "Voice", "Performance"), each judged 0-10 — empty means
   * a single implicit 0-10 score (constants/scoring.ts). Wrapped in `{ name }` objects,
   * not a plain string[], so the form's useFieldArray has a stable key per row. */
  criteriaNames: z
    .array(
      z.object({
        name: z.string().trim().min(1, "Scoring type name can't be empty.").max(60),
      }),
    )
    .max(10, "Up to 10 scoring types."),
});

export type ProgramInput = z.infer<typeof programSchema>;

/** Create flow also picks a participation type (D-025) — immutable after creation, so
 * updateProgramAction keeps using the plain programSchema above, which silently strips
 * this field (zod objects drop unrecognized keys by default) if the same form values
 * are ever submitted through the edit path. */
export const createProgramSchema = programSchema.extend({
  participation_type: z.enum(participationTypeValues, { error: "Select a participation type." }),
});

export type CreateProgramInput = z.infer<typeof createProgramSchema>;
