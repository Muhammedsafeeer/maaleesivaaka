import { z } from "zod";

/** The "form" here is really just a student picker, but the shared-schema pattern
 * still applies: the same validation runs in the dialog's zodResolver and the
 * Server Action's own re-validation. */
export const assignStudentSchema = z.object({
  student_id: z.uuid("Select a student."),
});

export type AssignStudentInput = z.infer<typeof assignStudentSchema>;
