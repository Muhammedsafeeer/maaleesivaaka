"use server";

import { revalidatePath } from "next/cache";
import {
  assignJudgeSchema,
  assignStudentSchema,
  type AssignJudgeInput,
  type AssignStudentInput,
} from "@/features/programs/validation/assignment.schema";
import {
  assignJudge,
  assignStudent,
  unassignJudge,
  unassignStudent,
} from "@/lib/services/assignment.service";
import { assertAdmin } from "@/lib/services/auth.service";

export type AssignmentActionResult = { error: string } | { error?: undefined };

export async function assignStudentAction(
  programId: string,
  input: AssignStudentInput,
): Promise<AssignmentActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const parsed = assignStudentSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const result = await assignStudent(programId, parsed.data.student_id);
  if (!result.success) return { error: result.error };

  revalidatePath(`/admin/programs/${programId}`);
  return {};
}

export async function unassignStudentAction(
  programId: string,
  studentId: string,
): Promise<AssignmentActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const result = await unassignStudent(programId, studentId);
  if (!result.success) return { error: result.error };

  revalidatePath(`/admin/programs/${programId}`);
  return {};
}

export async function assignJudgeAction(
  programId: string,
  input: AssignJudgeInput,
): Promise<AssignmentActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const parsed = assignJudgeSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const result = await assignJudge(programId, parsed.data.judge_id);
  if (!result.success) return { error: result.error };

  revalidatePath(`/admin/programs/${programId}`);
  return {};
}

export async function unassignJudgeAction(
  programId: string,
  judgeId: string,
): Promise<AssignmentActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const result = await unassignJudge(programId, judgeId);
  if (!result.success) return { error: result.error };

  revalidatePath(`/admin/programs/${programId}`);
  return {};
}
