"use server";

import { revalidatePath } from "next/cache";
import { groupSchema, type GroupInput } from "@/features/groups/validation/group.schema";
import { createGroup, updateGroup, deleteGroup } from "@/lib/services/group.service";
import { assertAdmin } from "@/lib/services/auth.service";

export type GroupActionResult = { error: string } | { error?: undefined };

export async function createGroupAction(input: GroupInput): Promise<GroupActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const parsed = groupSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const result = await createGroup(parsed.data);
  if (!result.success) return { error: result.error };

  revalidatePath("/admin/groups");
  return {};
}

export async function updateGroupAction(
  id: string,
  input: GroupInput,
): Promise<GroupActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const parsed = groupSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const result = await updateGroup(id, parsed.data);
  if (!result.success) return { error: result.error };

  revalidatePath("/admin/groups");
  return {};
}

export async function deleteGroupAction(id: string): Promise<GroupActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const result = await deleteGroup(id);
  if (!result.success) return { error: result.error };

  revalidatePath("/admin/groups");
  return {};
}
