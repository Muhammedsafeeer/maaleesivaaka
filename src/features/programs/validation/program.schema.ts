import { z } from "zod";
import {
  CATEGORIES,
  STAGE_TYPES,
  PROGRAM_STATUSES,
  type Category,
  type StageType,
  type ProgramStatus,
} from "@/constants/programs";

const categoryValues = CATEGORIES.map((c) => c.value) as [Category, ...Category[]];
const stageTypeValues = STAGE_TYPES.map((s) => s.value) as [StageType, ...StageType[]];
const statusValues = PROGRAM_STATUSES.map((s) => s.value) as [
  ProgramStatus,
  ...ProgramStatus[],
];

/**
 * Shared by the create/edit dialog's zodResolver and the Server Action's
 * re-validation. `status` is required here (no .default()) — a Zod default makes the
 * resolver's input/output types diverge, which breaks react-hook-form's Resolver
 * typing. The create dialog doesn't render a status field, but its form still submits
 * "draft" for it via useForm's defaultValues (see ProgramFormDialog's emptyDefaults).
 */
export const programSchema = z.object({
  name: z.string().min(1, "Name is required.").max(200),
  stage_type: z.enum(stageTypeValues, { error: "Select a stage type." }),
  category: z.enum(categoryValues, { error: "Select a category." }),
  status: z.enum(statusValues, { error: "Select a status." }),
});

export type ProgramInput = z.infer<typeof programSchema>;
