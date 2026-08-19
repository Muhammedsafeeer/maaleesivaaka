import { createClient } from "@/lib/supabase/server";
import type { Student } from "@/types/student";
import type { Profile } from "@/types/profile";

export type ServiceResult<T> = { success: true; data: T } | { success: false; error: string };

/** Students currently assigned to a program, joined for display — a raw program_students
 * row (just two foreign keys) means nothing on its own in a table. */
export async function listAssignedStudents(programId: string): Promise<Student[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("program_students")
    .select("students(*, student_categories(category))")
    .eq("program_id", programId)
    .order("created_at", { ascending: true });

  if (error) {
    return [];
  }

  return data.flatMap((row) => {
    if (!row.students) return [];
    const { student_categories, ...student } = row.students;
    return [{ ...student, categories: student_categories.map((c) => c.category) }];
  });
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

  // Two round trips rather than a single subquery filter — students now hold multiple
  // categories (D-024), so "matches this program's category" is a membership check,
  // not a column equality PostgREST can filter directly.
  const { data: categoryMatches } = await supabase
    .from("student_categories")
    .select("student_id")
    .eq("category", program.category);

  const candidateIds = (categoryMatches ?? []).map((row) => row.student_id);
  if (candidateIds.length === 0) {
    return [];
  }

  const { data: candidates, error: candidatesError } = await supabase
    .from("students")
    .select("*, student_categories(category)")
    .in("id", candidateIds)
    .order("name", { ascending: true });

  if (candidatesError) {
    return [];
  }

  return candidates
    .filter((student) => !assignedIds.has(student.id))
    .map(({ student_categories, ...student }) => ({
      ...student,
      categories: student_categories.map((row) => row.category),
    }));
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

/**
 * Assign a newly created student to several programs at once. Every program must
 * match the student's category (D-007) — checked here before insert so a mixed
 * selection fails cleanly instead of assigning the matching ones and rejecting the rest.
 */
export async function assignStudentToPrograms(
  studentId: string,
  programIds: string[],
): Promise<ServiceResult<null>> {
  const uniqueIds = [...new Set(programIds)];
  if (uniqueIds.length === 0) {
    return { success: true, data: null };
  }

  const supabase = await createClient();

  const { data: studentCategoryRows, error: studentError } = await supabase
    .from("student_categories")
    .select("category")
    .eq("student_id", studentId);

  if (studentError) {
    return { success: false, error: "Could not assign programs. Please try again." };
  }

  const studentCategories = new Set((studentCategoryRows ?? []).map((row) => row.category));

  const { data: programs, error: programsError } = await supabase
    .from("programs")
    .select("id, category")
    .in("id", uniqueIds);

  if (programsError || !programs || programs.length !== uniqueIds.length) {
    return { success: false, error: "One or more selected programs could not be found." };
  }

  if (programs.some((program) => !studentCategories.has(program.category))) {
    return {
      success: false,
      error: "This student's categories don't include one of the selected programs' category.",
    };
  }

  const { error } = await supabase.from("program_students").insert(
    uniqueIds.map((programId) => ({ program_id: programId, student_id: studentId })),
  );

  if (error) {
    if (error.code === "23514") {
      return {
        success: false,
        error: "This student's category doesn't match the program's category.",
      };
    }
    return { success: false, error: "Could not assign the student to programs. Please try again." };
  }

  return { success: true, data: null };
}

/** Every student's current program assignments, for the admin students list/edit dialog. */
export async function listProgramIdsByStudent(): Promise<Record<string, string[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("program_students")
    .select("student_id, program_id");

  if (error || !data) {
    return {};
  }

  const byStudent: Record<string, string[]> = {};
  for (const row of data) {
    const list = byStudent[row.student_id] ?? [];
    list.push(row.program_id);
    byStudent[row.student_id] = list;
  }
  return byStudent;
}

/**
 * Replace a student's program list with `programIds`. Adds missing assignments first
 * (so a category change can attach the new programs), then removes unchecked ones.
 * Removal still refuses programs that already have scores (same rule as unassignStudent).
 */
export async function syncStudentPrograms(
  studentId: string,
  programIds: string[],
): Promise<ServiceResult<null>> {
  const desired = new Set(programIds);
  const supabase = await createClient();
  const { data: currentRows, error } = await supabase
    .from("program_students")
    .select("program_id")
    .eq("student_id", studentId);

  if (error) {
    return { success: false, error: "Could not update program assignments. Please try again." };
  }

  const current = new Set((currentRows ?? []).map((row) => row.program_id));
  const toAdd = [...desired].filter((id) => !current.has(id));
  const toRemove = [...current].filter((id) => !desired.has(id));

  if (toAdd.length > 0) {
    const added = await assignStudentToPrograms(studentId, toAdd);
    if (!added.success) {
      return added;
    }
  }

  for (const programId of toRemove) {
    const removed = await unassignStudent(programId, studentId);
    if (!removed.success) {
      return removed;
    }
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

/** Judges currently assigned to a program (program_judges), joined for display. */
export async function listAssignedJudges(programId: string): Promise<Profile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("program_judges")
    .select("profiles(*)")
    .eq("program_id", programId)
    .order("created_at", { ascending: true });

  if (error) {
    return [];
  }

  return data.flatMap((row) => (row.profiles ? [row.profiles] : []));
}

/**
 * Judges eligible to be added: any judge not already assigned. Unlike students, there's
 * no category match to enforce — docs/project.md's "Judge Assignment" just says "assign
 * one or more judges to programs."
 */
export async function listAssignableJudges(programId: string): Promise<Profile[]> {
  const supabase = await createClient();

  const { data: assigned } = await supabase
    .from("program_judges")
    .select("judge_id")
    .eq("program_id", programId);

  const assignedIds = new Set((assigned ?? []).map((row) => row.judge_id));

  const { data: candidates, error: candidatesError } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "judge")
    .order("name", { ascending: true });

  if (candidatesError) {
    return [];
  }

  return candidates.filter((judge) => !assignedIds.has(judge.id));
}

export async function assignJudge(
  programId: string,
  judgeId: string,
): Promise<ServiceResult<null>> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("program_judges")
    .insert({ program_id: programId, judge_id: judgeId });

  if (error) {
    return { success: false, error: "Could not assign the judge. Please try again." };
  }

  return { success: true, data: null };
}

export async function unassignJudge(
  programId: string,
  judgeId: string,
): Promise<ServiceResult<null>> {
  const supabase = await createClient();

  // Same reasoning as unassignStudent: no FK ties judge_scores to program_judges, so a
  // judge who already scored this program could silently become "unassigned but still
  // scored" without this check.
  const { count: scoreCount } = await supabase
    .from("judge_scores")
    .select("*", { count: "exact", head: true })
    .eq("program_id", programId)
    .eq("judge_id", judgeId);

  if (scoreCount && scoreCount > 0) {
    return {
      success: false,
      error: "This judge already has scores recorded for this program and can't be removed.",
    };
  }

  const { error } = await supabase
    .from("program_judges")
    .delete()
    .eq("program_id", programId)
    .eq("judge_id", judgeId);

  if (error) {
    return { success: false, error: "Could not remove the judge. Please try again." };
  }

  return { success: true, data: null };
}
