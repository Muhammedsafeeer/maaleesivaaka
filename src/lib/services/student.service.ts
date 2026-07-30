import { createClient } from "@/lib/supabase/server";
import type { Student, StudentWithGroup } from "@/types/student";
import type { Category, Gender } from "@/constants/programs";

export type ServiceResult<T> = { success: true; data: T } | { success: false; error: string };

export type StudentFilters = {
  q?: string;
  category?: Category;
  groupId?: string;
};

export async function listStudents(
  filters: StudentFilters = {},
): Promise<StudentWithGroup[]> {
  const supabase = await createClient();
  let query = supabase
    .from("students")
    .select("*, main_groups(name)")
    .order("name", { ascending: true });

  if (filters.q) {
    // Not SQL-injectable (PostgREST filter DSL, not raw SQL) — worst case a literal
    // "%" in the search text behaves as a wildcard instead of a literal character.
    query = query.or(`name.ilike.%${filters.q}%,roll_number.ilike.%${filters.q}%`);
  }
  if (filters.category) {
    query = query.eq("category", filters.category);
  }
  if (filters.groupId) {
    query = query.eq("group_id", filters.groupId);
  }

  const { data, error } = await query;

  if (error) {
    return [];
  }

  return data.map(({ main_groups, ...student }) => ({
    ...student,
    group_name: main_groups?.name ?? null,
  }));
}

export type StudentInput = {
  roll_number: string;
  name: string;
  class: string;
  gender: Gender;
  category: Category;
  group_id: string;
};

export async function createStudent(input: StudentInput): Promise<ServiceResult<Student>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("students")
    .insert(input)
    .select()
    .single();

  if (error) {
    return { success: false, error: "Could not create the student. Please try again." };
  }

  return { success: true, data };
}

export async function updateStudent(
  id: string,
  input: StudentInput,
): Promise<ServiceResult<Student>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("students")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { success: false, error: "Could not update the student. Please try again." };
  }

  return { success: true, data };
}

export async function deleteStudent(id: string): Promise<ServiceResult<null>> {
  const supabase = await createClient();
  const { error } = await supabase.from("students").delete().eq("id", id);

  if (error) {
    return {
      success: false,
      error:
        "Could not delete the student. They may still be assigned to a program or have scores recorded.",
    };
  }

  return { success: true, data: null };
}
