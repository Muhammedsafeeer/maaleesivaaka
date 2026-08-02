"use server";

import { revalidatePath } from "next/cache";
import { studentSchema, type StudentInput } from "@/features/students/validation/student.schema";
import {
  createStudent,
  updateStudent,
  deleteStudent,
  updateStudentPhoto,
} from "@/lib/services/student.service";
import { assertAdmin } from "@/lib/services/auth.service";
import type { Student } from "@/types/student";

export type StudentActionResult = { error: string } | { error?: undefined };

/** Unlike StudentActionResult, this hands the created row back — the create dialog
 * needs the new id right away so it can unlock the photo-upload step in place
 * instead of making the admin reopen the dialog in edit mode. */
export type CreateStudentActionResult =
  | { error: string; student?: undefined }
  | { error?: undefined; student: Student };

export async function createStudentAction(
  input: StudentInput,
): Promise<CreateStudentActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const parsed = studentSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const result = await createStudent(parsed.data);
  if (!result.success) return { error: result.error };

  revalidatePath("/admin/students");
  revalidatePath("/admin");
  return { student: result.data };
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

/** Called by the photo upload widget right after a file finishes uploading to
 * Storage — persists the resulting URL (or null, on remove) onto the row. */
export async function updateStudentPhotoAction(
  id: string,
  photoUrl: string | null,
): Promise<StudentActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const result = await updateStudentPhoto(id, photoUrl);
  if (!result.success) return { error: result.error };

  revalidatePath("/admin/students");
  return {};
}
