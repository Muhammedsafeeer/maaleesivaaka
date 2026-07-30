import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/profile";

export type ServiceResult<T> = { success: true; data: T } | { success: false; error: string };

/**
 * profiles rows where role = 'judge'. Account creation/deletion goes through the
 * service-role route handlers (src/app/api/judges) since only the Admin API can touch
 * auth.users — this service only reads/updates the profiles row, which is a normal
 * authenticated-role operation covered by D-011's admin policies.
 */
export async function listJudges(): Promise<Profile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "judge")
    .order("name", { ascending: true });

  if (error) {
    return [];
  }

  return data;
}

export async function updateJudgeName(id: string, name: string): Promise<ServiceResult<Profile>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({ name })
    .eq("id", id)
    .eq("role", "judge")
    .select()
    .single();

  if (error) {
    return { success: false, error: "Could not update the judge. Please try again." };
  }

  return { success: true, data };
}
