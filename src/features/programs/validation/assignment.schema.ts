import { z } from "zod";

/** The "form" here is really just a student picker, but the shared-schema pattern
 * still applies: the same validation runs in the dialog's zodResolver and the
 * Server Action's own re-validation. */
export const assignStudentSchema = z.object({
  student_id: z.uuid("Select a student."),
});

export type AssignStudentInput = z.infer<typeof assignStudentSchema>;

/** Bulk variant for the group-entry "Add student" tick-list — add several team members
 * from one house in one go instead of reopening the dialog per student. */
export const assignStudentsSchema = z.object({
  student_ids: z.array(z.uuid()).min(1, "Select at least one student."),
});

export type AssignStudentsInput = z.infer<typeof assignStudentsSchema>;

export const assignJudgeSchema = z.object({
  judge_id: z.uuid("Select a judge."),
});

export type AssignJudgeInput = z.infer<typeof assignJudgeSchema>;
