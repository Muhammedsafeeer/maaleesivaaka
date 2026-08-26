import { createClient } from "@/lib/supabase/server";
import type { Student, StudentWithGroup } from "@/types/student";
import type { Profile } from "@/types/profile";

export type ServiceResult<T> = { success: true; data: T } | { success: false; error: string };

/** Students currently assigned to a program, joined for display — a raw program_students
 * row (just two foreign keys) means nothing on its own in a table. Includes house name
 * so the roster can show "Name (House)" in brackets. */
export async function listAssignedStudents(programId: string): Promise<StudentWithGroup[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("program_students")
    .select("students(*, student_categories(category), main_groups(name))")
    .eq("program_id", programId)
    .order("created_at", { ascending: true });

  if (error) {
    return [];
  }

  return data.flatMap((row) => {
    if (!row.students) return [];
    const { student_categories, main_groups, ...student } = row.students;
    return [
      {
        ...student,
        categories: student_categories.map((c) => c.category),
        group_name: main_groups?.name ?? null,
      },
    ];
  });
}

export type AssignedGroupMember = Student & { group_entry_id: string | null };

/**
 * Same as listAssignedStudents, plus each member's group_entry_id (D-025 follow-up) —
 * the group roster panel needs this to know which SET a member belongs to, now that a
 * house can have more than one entry in the same program. Kept as a separate function
 * rather than widening listAssignedStudents' return shape, since every other caller
 * (individual-program roster, fixture, certificates, etc.) has no use for it.
 */
export async function listAssignedGroupMembers(programId: string): Promise<AssignedGroupMember[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("program_students")
    .select("group_entry_id, students(*, student_categories(category))")
    .eq("program_id", programId)
    .order("created_at", { ascending: true });

  if (error) {
    return [];
  }

  return data.flatMap((row) => {
    if (!row.students) return [];
    const { student_categories, ...student } = row.students;
    return [
      {
        ...student,
        categories: student_categories.map((c) => c.category),
        group_entry_id: row.group_entry_id,
      },
    ];
  });
}

/**
 * Students eligible to be added: matching the program's category (D-007) and not
 * already assigned. Two round trips rather than a single NOT-IN-subquery filter —
 * simpler and plenty fast at this project's scale (D-002's own reasoning: hundreds of
 * students, a few dozen programs).
 */
export async function listAssignableStudents(programId: string): Promise<StudentWithGroup[]> {
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
    .select("*, student_categories(category), main_groups(name)")
    .in("id", candidateIds)
    .order("name", { ascending: true });

  if (candidatesError) {
    return [];
  }

  return candidates
    .filter((student) => !assignedIds.has(student.id))
    .map(({ student_categories, main_groups, ...student }) => ({
      ...student,
      categories: student_categories.map((row) => row.category),
      group_name: main_groups?.name ?? null,
    }));
}

/**
 * Students eligible to join a specific team entry in a group program (D-025): same
 * category-match + not-already-assigned rules as listAssignableStudents, plus
 * restricted to the entry's own house — the DB trigger would reject anyone else anyway,
 * but filtering here keeps the picker from ever offering an invalid choice.
 */
export async function listAssignableStudentsForGroupEntry(
  programId: string,
  groupId: string,
): Promise<StudentWithGroup[]> {
  const candidates = await listAssignableStudents(programId);
  return candidates.filter((student) => student.group_id === groupId);
}

export async function assignStudent(
  programId: string,
  studentId: string,
  groupEntryId?: string,
): Promise<ServiceResult<null>> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("program_students")
    .insert({ program_id: programId, student_id: studentId, group_entry_id: groupEntryId ?? null });

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
 * Assign several students to one program at once (group-entry tick-list: add every
 * ticked house member in one round trip instead of one assignStudent call per student).
 * The category-match / group-entry-exists trigger (D-024/D-025) still fires per row, so
 * a bad id in the batch fails the whole insert rather than partially applying.
 */
export async function assignStudents(
  programId: string,
  studentIds: string[],
  groupEntryId?: string,
): Promise<ServiceResult<null>> {
  const uniqueIds = [...new Set(studentIds)];
  if (uniqueIds.length === 0) {
    return { success: true, data: null };
  }

  const supabase = await createClient();

  // Admin-configured cap on team/set size (programs.max_team_size), only relevant for
  // the group-entry tick-list — enforced going forward only: this blocks adding PAST
  // the limit, it never evicts anyone already over it if the cap is lowered later.
  if (groupEntryId) {
    const [{ data: program }, { count: currentCount }] = await Promise.all([
      supabase.from("programs").select("max_team_size").eq("id", programId).single(),
      supabase
        .from("program_students")
        .select("id", { count: "exact", head: true })
        .eq("group_entry_id", groupEntryId),
    ]);

    const maxTeamSize = program?.max_team_size;
    if (maxTeamSize && (currentCount ?? 0) + uniqueIds.length > maxTeamSize) {
      const remaining = Math.max(maxTeamSize - (currentCount ?? 0), 0);
      return {
        success: false,
        error:
          remaining === 0
            ? `This team is already at its limit of ${maxTeamSize} members.`
            : `This team allows at most ${maxTeamSize} members — only ${remaining} more can be added.`,
      };
    }
  }

  const { error } = await supabase.from("program_students").insert(
    uniqueIds.map((studentId) => ({
      program_id: programId,
      student_id: studentId,
      group_entry_id: groupEntryId ?? null,
    })),
  );

  if (error) {
    if (error.code === "23514") {
      return {
        success: false,
        error: "One of the selected students doesn't match this program's requirements.",
      };
    }
    return { success: false, error: "Could not assign the students. Please try again." };
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

  // D-025 follow-up: a group program's judge_scores rows are keyed by group_entry_id,
  // not student_id (a team/set is scored once, not once per member), so the check above
  // never finds anything for a group program — without this, a student could be pulled
  // off an already-scored set's roster with no protection at all. Read the STUDENT'S OWN
  // assignment row for its group_entry_id rather than re-deriving "the" entry from their
  // house: a house can now have more than one set in the same program, so house alone
  // no longer identifies a single entry.
  const { data: assignment } = await supabase
    .from("program_students")
    .select("group_entry_id")
    .eq("program_id", programId)
    .eq("student_id", studentId)
    .maybeSingle();

  if (assignment?.group_entry_id) {
    const { count: teamScoreCount } = await supabase
      .from("judge_scores")
      .select("*", { count: "exact", head: true })
      .eq("program_id", programId)
      .eq("group_entry_id", assignment.group_entry_id);

    if (teamScoreCount && teamScoreCount > 0) {
      return {
        success: false,
        error: "This student's team already has scores recorded for this program and can't be removed.",
      };
    }
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
