import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";
import type { Student, StudentWithGroup } from "@/types/student";
export type ServiceResult<T> = { success: true; data: T } | { success: false; error: string };

export type StudentFilters = {
  q?: string;
  category?: string;
  groupId?: string;
};

function withCategories<T extends { student_categories: { category: string }[] }>(
  student: T,
): Omit<T, "student_categories"> & { categories: string[] } {
  const { student_categories, ...rest } = student;
  return { ...rest, categories: student_categories.map((row) => row.category) };
}

export async function listStudents(
  filters: StudentFilters = {},
): Promise<StudentWithGroup[]> {
  const supabase = await createClient();
  let query = supabase
    .from("students")
    .select("*, main_groups(name), student_categories(category)")
    .order("name", { ascending: true });

  if (filters.q) {
    // Not SQL-injectable (PostgREST filter DSL, not raw SQL) — worst case a literal
    // "%" in the search text behaves as a wildcard instead of a literal character.
    query = query.or(`name.ilike.%${filters.q}%,roll_number.ilike.%${filters.q}%`);
  }
  if (filters.category) {
    // Two round trips rather than a single subquery filter — same pattern as
    // listAssignableStudents in assignment.service.ts.
    const { data: matches } = await supabase
      .from("student_categories")
      .select("student_id")
      .eq("category", filters.category as Database["public"]["Enums"]["participant_category"]);
    const ids = (matches ?? []).map((row) => row.student_id);
    if (ids.length === 0) {
      return [];
    }
    query = query.in("id", ids);
  }
  if (filters.groupId) {
    query = query.eq("group_id", filters.groupId);
  }

  const { data, error } = await query;

  if (error) {
    return [];
  }

  return data.map(({ main_groups, ...student }) => ({
    ...withCategories(student),
    group_name: main_groups?.name ?? null,
  }));
}

/** Newest-first slice for the dashboard's students preview — a different ordering
 * than listStudents' alphabetical listing, so it's its own query rather than a
 * `limit` option bolted onto listStudents. */
export async function listRecentStudents(limit: number): Promise<StudentWithGroup[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("students")
    .select("*, main_groups(name), student_categories(category)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return [];
  }

  return data.map(({ main_groups, ...student }) => ({
    ...withCategories(student),
    group_name: main_groups?.name ?? null,
  }));
}

export type StudentInput = {
  roll_number: string;
  name: string;
  malayalamName?: string;
  class: string;
  gender: string;
  categories: string[];
  group_id: string;
};

function toRow(input: StudentInput) {
  return {
    roll_number: input.roll_number,
    name: input.name,
    malayalam_name: input.malayalamName || null,
    class: input.class,
    gender: input.gender as Database["public"]["Enums"]["gender"],
    group_id: input.group_id,
  };
}

/** Replaces a student's category rows wholesale — simpler than diffing when the
 * whole set comes from the form every time (same delete-all-then-insert pattern as
 * assignment.service.ts's program sync, minus the diff since there's no "already
 * scored" concern for categories). */
async function syncStudentCategories(
  studentId: string,
  categories: string[],
): Promise<ServiceResult<null>> {
  const supabase = await createClient();
  const { error: deleteError } = await supabase
    .from("student_categories")
    .delete()
    .eq("student_id", studentId);

  if (deleteError) {
    return { success: false, error: "Could not update the student's categories." };
  }

  if (categories.length === 0) {
    return { success: true, data: null };
  }

  const { error: insertError } = await supabase.from("student_categories").insert(
    categories.map((category) => ({
      student_id: studentId,
      category: category as Database["public"]["Enums"]["participant_category"],
    })),
  );

  if (insertError) {
    return { success: false, error: "Could not update the student's categories." };
  }

  return { success: true, data: null };
}

export async function createStudent(input: StudentInput): Promise<ServiceResult<Student>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("students")
    .insert(toRow(input))
    .select()
    .single();

  if (error) {
    // errcode 23505 (unique_violation) is the students_class_roll_number_key constraint
    // (20260805020000_roll_number_unique_per_class.sql) — same "translate the DB's raw
    // error into a friendly one" reasoning as assignment.service.ts's 23514 check.
    if (error.code === "23505") {
      return { success: false, error: "That chest number is already in use in this class." };
    }
    return { success: false, error: "Could not create the student. Please try again." };
  }

  const categoriesResult = await syncStudentCategories(data.id, input.categories);
  if (!categoriesResult.success) {
    return categoriesResult;
  }

  return { success: true, data: { ...data, categories: input.categories } };
}

export async function updateStudent(
  id: string,
  input: StudentInput,
): Promise<ServiceResult<Student>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("students")
    .update(toRow(input))
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "That chest number is already in use in this class." };
    }
    return { success: false, error: "Could not update the student. Please try again." };
  }

  const categoriesResult = await syncStudentCategories(id, input.categories);
  if (!categoriesResult.success) {
    return categoriesResult;
  }

  return { success: true, data: { ...data, categories: input.categories } };
}

/** Phase 9: used by the photo upload widget, which persists photo_url immediately on
 * selection — independent of the rest of the form's "Save changes" button. */
export async function updateStudentPhoto(
  id: string,
  photoUrl: string | null,
): Promise<ServiceResult<Student>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("students")
    .update({ photo_url: photoUrl })
    .eq("id", id)
    .select("*, student_categories(category)")
    .single();

  if (error) {
    return { success: false, error: "Could not save the photo. Please try again." };
  }

  return { success: true, data: withCategories(data) };
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
