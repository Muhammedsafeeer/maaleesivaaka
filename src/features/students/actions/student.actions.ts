"use server";

import { revalidatePath } from "next/cache";
import {
  createStudentSchema,
  type CreateStudentInput,
} from "@/features/students/validation/student.schema";
import {
  createStudent,
  updateStudent,
  deleteStudent,
  updateStudentPhoto,
} from "@/lib/services/student.service";
import {
  assignStudentToPrograms,
  syncStudentPrograms,
} from "@/lib/services/assignment.service";
import { assertAdmin } from "@/lib/services/auth.service";
import type { Student } from "@/types/student";

export type StudentActionResult =
  | { error: string; assignmentError?: undefined }
  | { error?: undefined; assignmentError?: string };

/** Unlike StudentActionResult, this hands the created row back — the create dialog
 * needs the new id right away so it can unlock the photo-upload step in place
 * instead of making the admin reopen the dialog in edit mode. */
export type CreateStudentActionResult =
  | { error: string; student?: undefined; assignmentError?: undefined }
  | { error?: undefined; student: Student; assignmentError?: string };

export async function createStudentAction(
  input: CreateStudentInput,
): Promise<CreateStudentActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const parsed = createStudentSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { program_ids, ...studentInput } = parsed.data;
  const result = await createStudent(studentInput);
  if (!result.success) return { error: result.error };

  let assignmentError: string | undefined;
  if (program_ids.length > 0) {
    const assigned = await assignStudentToPrograms(result.data.id, program_ids);
    if (!assigned.success) {
      assignmentError = assigned.error;
    }
  }

  revalidatePath("/admin/students");
  revalidatePath("/admin");
  revalidatePath("/admin/programs");
  return { student: result.data, assignmentError };
}

export async function updateStudentAction(
  id: string,
  input: CreateStudentInput,
): Promise<StudentActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const parsed = createStudentSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { program_ids, ...studentInput } = parsed.data;
  const result = await updateStudent(id, studentInput);
  if (!result.success) return { error: result.error };

  const assigned = await syncStudentPrograms(id, program_ids);
  revalidatePath("/admin/students");
  revalidatePath("/admin/programs");

  if (!assigned.success) {
    return { assignmentError: assigned.error };
  }

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
