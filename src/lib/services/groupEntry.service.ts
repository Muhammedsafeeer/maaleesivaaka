import { createClient } from "@/lib/supabase/server";
import type { ProgramGroupEntryWithGroup } from "@/types/programGroupEntry";

export type ServiceResult<T> = { success: true; data: T } | { success: false; error: string };

/** A group program's team entries (one per house), for the admin roster panel. */
export async function listGroupEntries(programId: string): Promise<ProgramGroupEntryWithGroup[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("program_group_entries")
    .select("*, main_groups(name)")
    .eq("program_id", programId)
    .order("created_at", { ascending: true });

  if (error) {
    return [];
  }

  return data.map(({ main_groups, ...entry }) => ({
    ...entry,
    group_name: main_groups?.name ?? null,
  }));
}

export async function createGroupEntry(
  programId: string,
  groupId: string,
  chestNumber: string,
): Promise<ServiceResult<ProgramGroupEntryWithGroup>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("program_group_entries")
    .insert({ program_id: programId, group_id: groupId, chest_number: chestNumber })
    .select("*, main_groups(name)")
    .single();

  if (error) {
    // errcode 23505 (unique_violation) is one of the two unique constraints on
    // (program_id, group_id) or (program_id, chest_number) — can't tell which from the
    // error alone, so this covers both with one message (agents.md: never expose raw
    // database errors).
    if (error.code === "23505") {
      return {
        success: false,
        error: "This house already has a team here, or that chest number is already used in this program.",
      };
    }
    return { success: false, error: "Could not create the team. Please try again." };
  }

  const { main_groups, ...entry } = data;
  return { success: true, data: { ...entry, group_name: main_groups?.name ?? null } };
}

export async function updateGroupEntryChestNumber(
  entryId: string,
  chestNumber: string,
): Promise<ServiceResult<ProgramGroupEntryWithGroup>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("program_group_entries")
    .update({ chest_number: chestNumber })
    .eq("id", entryId)
    .select("*, main_groups(name)")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "That chest number is already used in this program." };
    }
    return { success: false, error: "Could not update the chest number. Please try again." };
  }

  const { main_groups, ...entry } = data;
  return { success: true, data: { ...entry, group_name: main_groups?.name ?? null } };
}

export async function deleteGroupEntry(entryId: string): Promise<ServiceResult<null>> {
  const supabase = await createClient();

  const { data: entry } = await supabase
    .from("program_group_entries")
    .select("program_id, group_id")
    .eq("id", entryId)
    .single();

  if (!entry) {
    return { success: false, error: "Team not found." };
  }

  const { count } = await supabase
    .from("program_students")
    .select("students!inner(group_id)", { count: "exact", head: true })
    .eq("program_id", entry.program_id)
    .eq("students.group_id", entry.group_id);

  if (count && count > 0) {
    return {
      success: false,
      error: "This team still has students assigned and can't be deleted.",
    };
  }

  const { error } = await supabase.from("program_group_entries").delete().eq("id", entryId);

  if (error) {
    return { success: false, error: "Could not delete the team. Please try again." };
  }

  return { success: true, data: null };
}
