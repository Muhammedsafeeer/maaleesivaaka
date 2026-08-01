import { createClient } from "@/lib/supabase/server";
import type { Program } from "@/types/program";
import { CATEGORIES, type Category, type StageType, type ProgramStatus } from "@/constants/programs";

export type ServiceResult<T> = { success: true; data: T } | { success: false; error: string };

export type ProgramFilters = {
  q?: string;
  status?: ProgramStatus;
};

export async function listPrograms(filters: ProgramFilters = {}): Promise<Program[]> {
  const supabase = await createClient();
  let query = supabase.from("programs").select("*").order("name", { ascending: true });

  if (filters.q) {
    query = query.ilike("name", `%${filters.q}%`);
  }
  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;

  if (error) {
    // D-015: without this, a real query/RLS failure here looks identical to "no
    // programs match" to every caller (audience "Now Performing", admin list, ...) —
    // logged so it's diagnosable from server logs instead of a silent empty result.
    console.error("listPrograms failed:", error.message);
    return [];
  }

  return data;
}

export type CategoryStatus = {
  category: Category;
  declared: number;
  total: number;
};

/**
 * Audience "Status of Festival" widget (Phase 17): declared (published) vs. total
 * programs, per category. Excludes 'draft' programs from `total` — a draft is admin
 * setup-in-progress, not a real commitment yet, so it shouldn't dent the audience-facing
 * completion picture. Computed in JS from `listPrograms({})` rather than a new SQL
 * view/RPC — the dataset is one school's programs, small enough that a single-pass
 * reduce is simpler and more honest than adding DB machinery for it.
 */
export async function listCategoryStatus(): Promise<CategoryStatus[]> {
  const programs = await listPrograms({});
  const scheduled = programs.filter((p) => p.status !== "draft");

  return CATEGORIES.map(({ value: category }) => {
    const inCategory = scheduled.filter((p) => p.category === category);
    return {
      category,
      declared: inCategory.filter((p) => p.status === "published").length,
      total: inCategory.length,
    };
  });
}

export async function getProgram(id: string): Promise<Program | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("programs").select("*").eq("id", id).single();

  if (error) {
    return null;
  }

  return data;
}

/** No `status` here — Phase 17 made status fully system-managed (see program.schema.ts). */
export type ProgramInput = {
  name: string;
  stage_type: StageType;
  category: Category;
};

export async function createProgram(input: ProgramInput): Promise<ServiceResult<Program>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("programs")
    .insert(input)
    .select()
    .single();

  if (error) {
    return { success: false, error: "Could not create the program. Please try again." };
  }

  return { success: true, data };
}

export async function updateProgram(
  id: string,
  input: ProgramInput,
): Promise<ServiceResult<Program>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("programs")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { success: false, error: "Could not update the program. Please try again." };
  }

  return { success: true, data };
}

export async function deleteProgram(id: string): Promise<ServiceResult<null>> {
  const supabase = await createClient();
  const { error } = await supabase.from("programs").delete().eq("id", id);

  if (error) {
    return {
      success: false,
      error:
        "Could not delete the program. It may still have students, judges, or scores attached to it.",
    };
  }

  return { success: true, data: null };
}
