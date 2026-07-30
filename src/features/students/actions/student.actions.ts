"use server";

import { revalidatePath } from "next/cache";
import { studentSchema, type StudentInput } from "@/features/students/validation/student.schema";
import {
  createStudent,
  updateStudent,
  deleteStudent,
} from "@/lib/services/student.service";
import { assertAdmin } from "@/lib/services/auth.service";

export type StudentActionResult = { error: string } | { error?: undefined };

export async function createStudentAction(
  input: StudentInput,
): Promise<StudentActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const parsed = studentSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const result = await createStudent(parsed.data);
  if (!result.success) return { error: result.error };

  revalidatePath("/admin/students");
  return {};
}

export async function updateStudentAction(
  id: string,
  input: StudentInput,
): Promise<StudentActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const parsed = studentSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const result = await updateStudent(id, parsed.data);
  if (!result.success) return { error: result.error };

  revalidatePath("/admin/students");
  return {};
}

export async function deleteStudentAction(id: string): Promise<StudentActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const result = await deleteStudent(id);
  if (!result.success) return { error: result.error };

  revalidatePath("/admin/students");
  return {};
}
