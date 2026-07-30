import { createClient } from "@/lib/supabase/server";
import type { Student } from "@/types/student";

export type ServiceResult<T> = { success: true; data: T } | { success: false; error: string };

/** Students currently assigned to a program, joined for display — a raw program_students
 * row (just two foreign keys) means nothing on its own in a table. */
export async function listAssignedStudents(programId: string): Promise<Student[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("program_students")
    .select("students(*)")
    .eq("program_id", programId)
    .order("created_at", { ascending: true });

  if (error) {
    return [];
  }

  return data.flatMap((row) => (row.students ? [row.students] : []));
}

/**
 * Students eligible to be added: matching the program's category (D-007) and not
 * already assigned. Two round trips rather than a single NOT-IN-subquery filter —
 * simpler and plenty fast at this project's scale (D-002's own reasoning: hundreds of
 * students, a few dozen programs).
 */
export async function listAssignableStudents(programId: string): Promise<Student[]> {
  const supabase = await createClient();

  const { data: program, error: programError } = await supabase
    .from("programs")
    .select("category")
    .eq("id", programId)
    .single();

  if (programError || !program) {
    return [];
  }

  const { data: assigned } = await supabase
    .from("program_students")
    .select("student_id")
    .eq("program_id", programId);

  const assignedIds = new Set((assigned ?? []).map((row) => row.student_id));

  const { data: candidates, error: candidatesError } = await supabase
    .from("students")
    .select("*")
    .eq("category", program.category)
    .order("name", { ascending: true });

  if (candidatesError) {
    return [];
  }

  return candidates.filter((student) => !assignedIds.has(student.id));
}

export async function assignStudent(
  programId: string,
  studentId: string,
): Promise<ServiceResult<null>> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("program_students")
    .insert({ program_id: programId, student_id: studentId });

  if (error) {
    // errcode 23514 (check_violation) is the D-007 category-match trigger. The UI only
    // ever offers category-matched students in the first place, so this should be rare
    // — but a Server Action is a public endpoint, and the trigger's own raw message is
    // never shown to the user regardless (agents.md).
    if (error.code === "23514") {
      return {
        success: false,
        error: "This student's category doesn't match the program's category.",
      };
    }
    return { success: false, error: "Could not assign the student. Please try again." };
  }

  return { success: true, data: null };
}

export async function unassignStudent(
  programId: string,
  studentId: string,
): Promise<ServiceResult<null>> {
  const supabase = await createClient();

  // No foreign key ties judge_scores to program_students (Phase 5 schema) — removing
  // an assignment doesn't cascade or get blocked at the database level, so a student
  // already scored for this program could silently become "unassigned but still
  // scored" without this check.
  const { count: scoreCount } = await supabase
    .from("judge_scores")
    .select("*", { count: "exact", head: true })
    .eq("program_id", programId)
    .eq("student_id", studentId);

  if (scoreCount && scoreCount > 0) {
    return {
      success: false,
      error: "This student already has scores recorded for this program and can't be removed.",
    };
  }

  const { error } = await supabase
    .from("program_students")
    .delete()
    .eq("program_id", programId)
    .eq("student_id", studentId);

  if (error) {
    return { success: false, error: "Could not remove the student. Please try again." };
  }

  return { success: true, data: null };
}
