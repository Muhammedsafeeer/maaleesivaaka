import { createClient } from "@/lib/supabase/server";
import { CATEGORIES } from "@/constants/programs";
import type { ProgramGroupEntryWithGroup } from "@/types/programGroupEntry";

export type ServiceResult<T> = { success: true; data: T } | { success: false; error: string };

const categoryLabelByValue = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]));

/**
 * Chest number scheme (admin-requested): [house's first letter][category's
 * initials][set number] — e.g. house "A" + category "Sub Junior" + set 2 -> "ASJ2".
 * Category initials take one letter per word (multi-word categories like "Sub
 * Junior"/"Super Senior" become two letters, everything else one), since the house
 * letter alone isn't unique across categories. Pure so it's checkable against examples
 * without a database.
 */
export function computeChestNumber(groupName: string, categoryLabel: string, setNumber: number): string {
  const groupInitial = groupName.trim().charAt(0).toUpperCase();
  const categoryInitials = categoryLabel
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
  return `${groupInitial}${categoryInitials}${setNumber}`;
}

/** A group program's team entries — one or more numbered "sets" per house — for the
 * admin roster panel, in house then set order. */
export async function listGroupEntries(programId: string): Promise<ProgramGroupEntryWithGroup[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("program_group_entries")
    .select("*, main_groups(name)")
    .eq("program_id", programId)
    .order("group_id", { ascending: true })
    .order("set_number", { ascending: true });

  if (error) {
    return [];
  }

  return data.map(({ main_groups, ...entry }) => ({
    ...entry,
    group_name: main_groups?.name ?? null,
  }));
}

/**
 * Adds a new set/team entry for a house — a house can have more than one (e.g. two
 * separate group-dance sets performing the same program, scored independently). Both
 * the set number and chest number are computed automatically, never admin-typed:
 * set_number is one past this house's highest existing set in this program (not "count
 * of existing sets", which would reuse a number after a set was deleted and collide
 * with a still-alive chest number), and the chest number is derived from it.
 */
export async function createGroupEntry(
  programId: string,
  groupId: string,
): Promise<ServiceResult<ProgramGroupEntryWithGroup>> {
  const supabase = await createClient();

  const [{ data: program }, { data: group }, { data: lastSet }] = await Promise.all([
    supabase.from("programs").select("category").eq("id", programId).single(),
    supabase.from("main_groups").select("name").eq("id", groupId).single(),
    supabase
      .from("program_group_entries")
      .select("set_number")
      .eq("program_id", programId)
      .eq("group_id", groupId)
      .order("set_number", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (!program || !group) {
    return { success: false, error: "Could not create the team. Please try again." };
  }

  const setNumber = (lastSet?.set_number ?? 0) + 1;
  const categoryLabel = categoryLabelByValue[program.category] ?? program.category;
  const chestNumber = computeChestNumber(group.name, categoryLabel, setNumber);

  const { data, error } = await supabase
    .from("program_group_entries")
    .insert({ program_id: programId, group_id: groupId, set_number: setNumber, chest_number: chestNumber })
    .select("*, main_groups(name)")
    .single();

  if (error) {
    // 23505 here almost always means two houses share a starting letter and landed on
    // the same auto-generated chest number for this category — set_number itself can't
    // collide (computed as this house's own max + 1). The new entry was never created,
    // so the fix is renaming the EXISTING conflicting team's chest number, then retrying.
    if (error.code === "23505") {
      return {
        success: false,
        error:
          "The auto-generated chest number is already used by another team in this program (likely two houses share a starting letter). Rename that team's chest number, then try again.",
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

  // Per-entry (per-set), not per-house — a house's OTHER set having members doesn't
  // block deleting this one, now that a house can have more than one.
  const { count } = await supabase
    .from("program_students")
    .select("id", { count: "exact", head: true })
    .eq("group_entry_id", entryId);

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
