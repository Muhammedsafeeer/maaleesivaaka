import { z } from "zod";
import { CATEGORIES, GENDERS, type Category, type Gender } from "@/constants/programs";

// Cast to the literal union (not [string, ...string[]]) so z.infer below produces
// "kids" | "junior" | "senior", not a widened `string` — a widened type here silently
// breaks assignability into StudentInput at every call site.
const categoryValues = CATEGORIES.map((c) => c.value) as [Category, ...Category[]];
const genderValues = GENDERS.map((g) => g.value) as [Gender, ...Gender[]];

/** Shared by the create/edit dialog's zodResolver and the Server Action's re-validation. */
export const studentSchema = z.object({
  roll_number: z.string().min(1, "Roll number is required.").max(50),
  name: z.string().min(1, "Name is required.").max(200),
  class: z.string().min(1, "Class is required.").max(50),
  gender: z.enum(genderValues, { error: "Select a gender." }),
  category: z.enum(categoryValues, { error: "Select a category." }),
  group_id: z.uuid("Select a group."),
});

export type StudentInput = z.infer<typeof studentSchema>;
