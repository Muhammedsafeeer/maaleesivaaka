import { createClient } from "@/lib/supabase/server";
import type { Group } from "@/types/group";

export type ServiceResult<T> = { success: true; data: T } | { success: false; error: string };

export async function listGroups(): Promise<Group[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("main_groups")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    // Read-path failures degrade to an empty list — the page renders its empty state
    // rather than crashing. Server Actions (write paths) return a typed error instead.
    return [];
  }

  return data;
}

export type GroupInput = {
  name: string;
  malayalamName?: string;
};

export async function createGroup(input: GroupInput): Promise<ServiceResult<Group>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("main_groups")
    .insert({ name: input.name, malayalam_name: input.malayalamName || null })
    .select()
    .single();

  if (error) {
    return { success: false, error: "Could not create the group. Please try again." };
  }

  return { success: true, data };
}

export async function updateGroup(
  id: string,
  input: GroupInput,
): Promise<ServiceResult<Group>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("main_groups")
    .update({ name: input.name, malayalam_name: input.malayalamName || null })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { success: false, error: "Could not update the group. Please try again." };
  }

  return { success: true, data };
}

/** Phase 9: used by the photo upload widget, which persists photo_url immediately on
 * selection — independent of the rest of the form's "Save changes" button. */
export async function updateGroupPhoto(
  id: string,
  photoUrl: string | null,
): Promise<ServiceResult<Group>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("main_groups")
    .update({ photo_url: photoUrl })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { success: false, error: "Could not save the photo. Please try again." };
  }

  return { success: true, data };
}

export async function deleteGroup(id: string): Promise<ServiceResult<null>> {
  const supabase = await createClient();
  const { error } = await supabase.from("main_groups").delete().eq("id", id);

  if (error) {
    // The likely cause is students.group_id's ON DELETE RESTRICT (Phase 5) — a house
    // with students still in it can't be deleted. Postgres's raw message is never
    // shown to the user (agents.md), so this is a generic but accurate hint instead.
    return {
      success: false,
      error: "Could not delete the group. Make sure it has no students assigned to it.",
    };
  }

  return { success: true, data: null };
}
