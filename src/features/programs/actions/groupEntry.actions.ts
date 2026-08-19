"use server";

import { revalidatePath } from "next/cache";
import {
  createGroupEntrySchema,
  groupEntryChestNumberSchema,
  type CreateGroupEntryInput,
  type GroupEntryChestNumberInput,
} from "@/features/programs/validation/groupEntry.schema";
import {
  assignStudentsSchema,
  type AssignStudentsInput,
} from "@/features/programs/validation/assignment.schema";
import {
  createGroupEntry,
  updateGroupEntryChestNumber,
  deleteGroupEntry,
} from "@/lib/services/groupEntry.service";
import { assignStudents } from "@/lib/services/assignment.service";
import { assertAdmin } from "@/lib/services/auth.service";

export type GroupEntryActionResult = { error: string } | { error?: undefined };

export async function createGroupEntryAction(
  programId: string,
  input: CreateGroupEntryInput,
): Promise<GroupEntryActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const parsed = createGroupEntrySchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const result = await createGroupEntry(programId, parsed.data.group_id);
  if (!result.success) return { error: result.error };

  revalidatePath(`/admin/programs/${programId}`);
  return {};
}

export async function updateGroupEntryChestNumberAction(
  programId: string,
  entryId: string,
  input: GroupEntryChestNumberInput,
): Promise<GroupEntryActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const parsed = groupEntryChestNumberSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const result = await updateGroupEntryChestNumber(entryId, parsed.data.chest_number);
  if (!result.success) return { error: result.error };

  revalidatePath(`/admin/programs/${programId}`);
  return {};
}

export async function deleteGroupEntryAction(
  programId: string,
  entryId: string,
): Promise<GroupEntryActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const result = await deleteGroupEntry(entryId);
  if (!result.success) return { error: result.error };

  revalidatePath(`/admin/programs/${programId}`);
  return {};
}

/** Add every checked house member to the team in one round trip (D-025 group entries
 * are still plain program_students rows, same as an individual assignment). */
export async function assignStudentsToGroupEntryAction(
  programId: string,
  input: AssignStudentsInput,
): Promise<GroupEntryActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const parsed = assignStudentsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const result = await assignStudents(programId, parsed.data.student_ids, parsed.data.group_entry_id);
  if (!result.success) return { error: result.error };

  revalidatePath(`/admin/programs/${programId}`);
  return {};
}
