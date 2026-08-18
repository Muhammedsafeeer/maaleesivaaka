import { z } from "zod";
import { GENDERS, CLASSES, type Gender, type StudentClass } from "@/constants/programs";

const genderValues = GENDERS.map((g) => g.value) as [Gender, ...Gender[]];
const classValues = CLASSES.map((c) => c.value) as [StudentClass, ...StudentClass[]];

/** Shared by the create/edit dialog's zodResolver and the Server Action's re-validation. */
export const studentSchema = z.object({
  roll_number: z.string().min(1, "Chest number is required.").max(50),
  name: z.string().min(1, "Name is required.").max(200),
  malayalamName: z
    .string()
    .max(200, "Malayalam name must be 200 characters or fewer.")
    .optional(),
  class: z.enum(classValues, { error: "Select a class." }),
  gender: z.enum(genderValues, { error: "Select a gender." }),
  category: z.string().min(1, "Select a category."),
  group_id: z.uuid("Select a group."),
});

export type StudentInput = z.infer<typeof studentSchema>;

/** Create flow also assigns the new student to one or more category-matched programs. */
export const createStudentSchema = studentSchema.extend({
  program_ids: z.array(z.uuid()),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
