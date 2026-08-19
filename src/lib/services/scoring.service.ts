import { createClient } from "@/lib/supabase/server";
import { verifyAdminPassword } from "@/lib/services/auth.service";
import type { Student } from "@/types/student";
import type { Program } from "@/types/program";
import {
  DEFAULT_POSITION_POINTS,
  POINTS_FOR_UNPLACED,
  type ScoringPosition,
} from "@/constants/scoring";

/** Sentinel error returned by submitScores when a submission would change an
 * already-saved score and no (or no valid) admin override was supplied — scoring.actions.ts
 * matches on this to tell the client to show the override prompt instead of a plain toast. */
export const ADMIN_OVERRIDE_REQUIRED = "ADMIN_OVERRIDE_REQUIRED";

export type ServiceResult<T> = { success: true; data: T } | { success: false; error: string };

/**
 * A program this judge is assigned to, with THIS judge's own scoring progress —
 * "Pending" vs. "Completed" on the judge dashboard (docs/project.md) is judged by
 * whether this judge has scored every student assigned to the program, independent of
 * the program's own admin-controlled status.
 */
export type AssignedProgramSummary = Program & {
  totalStudents: number;
  scoredCount: number;
};

/**
 * RLS (Phase 7) already scopes "programs" to this judge's assignments, "program_students"
 * to assigned programs, and "judge_scores" to this judge's own rows — the .eq("judge_id")
 * filter below mirrors judge_scores' own policy rather than relying on RLS alone, same
 * "verify permissions inside every mutation/query" reasoning as everywhere else.
 */
export async function listAssignedPrograms(): Promise<AssignedProgramSummary[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data: programs, error } = await supabase
    .from("programs")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    // D-015: a query error here previously looked identical to "nothing assigned" —
    // logged so a real failure (e.g. a future RLS regression) is diagnosable from
    // server logs instead of looking like an empty dashboard.
    console.error("listAssignedPrograms failed:", error.message);
    return [];
  }

  if (programs.length === 0) {
    return [];
  }

  const programIds = programs.map((p) => p.id);

  const { data: studentRows } = await supabase
    .from("program_students")
    .select("program_id")
    .in("program_id", programIds);

  const { data: scoreRows } = await supabase
    .from("judge_scores")
    .select("program_id")
    .eq("judge_id", user.id)
    .in("program_id", programIds);

  const totalByProgram = new Map<string, number>();
  for (const row of studentRows ?? []) {
    totalByProgram.set(row.program_id, (totalByProgram.get(row.program_id) ?? 0) + 1);
  }

  const scoredByProgram = new Map<string, number>();
  for (const row of scoreRows ?? []) {
    scoredByProgram.set(row.program_id, (scoredByProgram.get(row.program_id) ?? 0) + 1);
  }

  return programs.map((program) => ({
    ...program,
    totalStudents: totalByProgram.get(program.id) ?? 0,
    scoredCount: scoredByProgram.get(program.id) ?? 0,
  }));
}

export type CriterionScore = { criterion_id: string; score: number };

export type ScorableStudent = Student & {
  score: number | null;
  criteriaScores: CriterionScore[];
};

/** Students assigned to a program, each with this judge's own existing score (null if
 * not yet scored). RLS already scopes both queries to rows this judge may see. */
export async function listScorableStudents(programId: string): Promise<ScorableStudent[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data: assigned, error } = await supabase
    .from("program_students")
    .select("students(*, student_categories(category))")
    .eq("program_id", programId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("listScorableStudents failed:", error.message);
    return [];
  }

  const students = assigned.flatMap((row) => {
    if (!row.students) return [];
    const { student_categories, ...student } = row.students;
    return [{ ...student, categories: student_categories.map((c) => c.category) }];
  });

  const { data: scores } = await supabase
    .from("judge_scores")
    .select("student_id, score, criteria_scores")
    .eq("program_id", programId)
    .eq("judge_id", user.id);

  const scoreByStudent = new Map((scores ?? []).map((row) => [row.student_id, row]));

  return students.map((student) => {
    const row = scoreByStudent.get(student.id);
    return {
      ...student,
      score: row?.score ?? null,
      criteriaScores: (row?.criteria_scores as CriterionScore[] | null) ?? [],
    };
  });
}

export type ScoreInput = {
  student_id: string;
  score: number;
  /** Present for programs with configured scoring types; submitScores recomputes
   * `score` from these rather than trusting the client's sum. */
  criteria_scores?: CriterionScore[];
};

export type AdminOverride = { password: string };

/**
 * Bulk upsert on the (program_id, student_id, judge_id) unique constraint (Phase 5) —
 * one statement, atomic, matches the RLS insert/update policies exactly (Phase 7).
 * Partial submissions are expected: a judge may score a few students, save, and finish
 * the rest later, so `scores` only needs to contain the rows actually being set.
 *
 * Changing a score that was already saved (as opposed to setting one for the first
 * time) requires a verified `adminOverride`, even while the program is still
 * 'scoring' — a judge shouldn't be able to unilaterally revise a submitted score
 * without an admin present to authorize it. Determined from the DB's current state,
 * not a client-sent flag, so a stale or hand-crafted request can't skip the check.
 */
export async function submitScores(
  programId: string,
  scores: ScoreInput[],
  adminOverride?: AdminOverride,
): Promise<ServiceResult<null>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You must be signed in to submit scores." };
  }

  // Not modeled in RLS (Phase 7 only checks assignment, not lifecycle stage) — this is
  // the app-level equivalent of D-007's category-match trigger: the UI already disables
  // the form outside 'scoring', this is the re-check for a direct Server Action call.
  const { data: program, error: programError } = await supabase
    .from("programs")
    .select("status")
    .eq("id", programId)
    .single();

  if (programError || !program) {
    return { success: false, error: "This program isn't available for scoring." };
  }

  if (program.status !== "scoring") {
    return { success: false, error: "Scoring isn't open for this program right now." };
  }

  // Defense in depth (mirrors the status re-check above): don't trust a
  // client-computed total. When the program has scoring types, recompute `score` as
  // the sum of the submitted criteria and require the submitted criterion ids to
  // exactly match the program's current set — catches both a stale client (rubric
  // changed since the page loaded) and a hand-crafted request.
  const { data: criteria } = await supabase
    .from("scoring_criteria")
    .select("id")
    .eq("program_id", programId);

  const validCriterionIds = new Set((criteria ?? []).map((c) => c.id));

  const rows: {
    program_id: string;
    student_id: string;
    judge_id: string;
    score: number;
    criteria_scores: CriterionScore[];
  }[] = [];

  for (const s of scores) {
    if (validCriterionIds.size > 0) {
      const submitted = s.criteria_scores ?? [];
      const submittedIds = submitted.map((cs) => cs.criterion_id);
      const idsMatch =
        submittedIds.length === validCriterionIds.size &&
        submittedIds.every((id) => validCriterionIds.has(id));

      if (!idsMatch) {
        return {
          success: false,
          error: "Scoring types have changed — please refresh and try again.",
        };
      }

      rows.push({
        program_id: programId,
        student_id: s.student_id,
        judge_id: user.id,
        score: submitted.reduce((sum, cs) => sum + cs.score, 0),
        criteria_scores: submitted,
      });
    } else {
      rows.push({
        program_id: programId,
        student_id: s.student_id,
        judge_id: user.id,
        score: s.score,
        criteria_scores: [],
      });
    }
  }

  // Re-editing a score this judge already saved for a student requires a verified
  // admin. "Already saved" is read fresh from the DB here, not inferred from anything
  // the client sent, so it can't be bypassed by a stale page or a hand-crafted call.
  const { data: existingRows } = await supabase
    .from("judge_scores")
    .select("student_id, score")
    .eq("program_id", programId)
    .eq("judge_id", user.id)
    .in(
      "student_id",
      rows.map((r) => r.student_id),
    );

  const existingScoreByStudent = new Map((existingRows ?? []).map((r) => [r.student_id, r.score]));

  const changesExistingScore = rows.some((row) => {
    const existing = existingScoreByStudent.get(row.student_id);
    return existing !== undefined && existing !== row.score;
  });

  if (changesExistingScore) {
    const authorized = adminOverride && (await verifyAdminPassword(adminOverride.password));
    if (!authorized) {
      return { success: false, error: ADMIN_OVERRIDE_REQUIRED };
    }
  }

  const { error } = await supabase
    .from("judge_scores")
    .upsert(rows, { onConflict: "program_id,student_id,judge_id" });

  if (error) {
    return { success: false, error: "Could not save scores. Please try again." };
  }

  return { success: true, data: null };
}

export type StudentAverage = { student_id: string; average_score: number };
export type RankedResult = {
  student_id: string;
  average_score: number;
  position: number;
  points: number;
};

/**
 * D-004: pure function — averages in, ranked results out, no Supabase import — so tie
 * behaviour is unit-testable in isolation. `RANK()` semantics, not `DENSE_RANK()`: tied
 * students share a position and each get that position's full points; the following
 * position is skipped (docs/decisions.md D-004's worked example: 95/95/88/80 →
 * 1st/1st/3rd/4th, 2nd skipped).
 *
 * `pointsByPosition` defaults to DEFAULT_POSITION_POINTS so existing callers and tests
 * are unaffected; result.service.ts passes the admin's current score_settings instead.
 */
export function rankResults(
  averages: StudentAverage[],
  pointsByPosition: Record<ScoringPosition, number> = DEFAULT_POSITION_POINTS,
): RankedResult[] {
  const sorted = [...averages].sort((a, b) => b.average_score - a.average_score);

  const results: RankedResult[] = [];
  let position = 0;
  let previousScore: number | null = null;
  let rank = 0;

  for (const entry of sorted) {
    rank += 1;
    if (entry.average_score !== previousScore) {
      position = rank;
      previousScore = entry.average_score;
    }

    const points = pointsByPosition[position as ScoringPosition] ?? POINTS_FOR_UNPLACED;
    results.push({ student_id: entry.student_id, average_score: entry.average_score, position, points });
  }

  return results;
}
