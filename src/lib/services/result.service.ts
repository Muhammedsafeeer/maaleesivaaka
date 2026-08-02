import { createClient } from "@/lib/supabase/server";
import { rankResults, type StudentAverage } from "@/lib/services/scoring.service";
import { getScoreSettings } from "@/lib/services/scoreSettings.service";
import { CATEGORIES } from "@/constants/programs";
import type { Database } from "@/types/database.types";

const CATEGORY_ORDER = new Map(CATEGORIES.map((c, index) => [c.value, index]));

export type ServiceResult<T> = { success: true; data: T } | { success: false; error: string };

export type Result = Database["public"]["Tables"]["results"]["Row"];

/**
 * D-003: if every assigned judge has now scored every assigned student, calculate and
 * write results, and flip the program to 'completed'. A no-op (success, no write) if
 * scoring isn't complete yet. Called from the scoring Server Action right after a
 * submission (D-014) — also safe to call again later as an admin-side "Recalculate"
 * fallback, since finalize_program_results is idempotent.
 */
export async function finalizeIfComplete(programId: string): Promise<ServiceResult<null>> {
  const supabase = await createClient();

  const { data: isComplete, error: checkError } = await supabase.rpc(
    "is_program_fully_scored",
    { p_program_id: programId },
  );

  if (checkError) {
    return { success: false, error: "Could not check scoring progress. Please try again." };
  }

  if (!isComplete) {
    return { success: true, data: null };
  }

  const { data: scores, error: scoresError } = await supabase.rpc("get_program_scores", {
    p_program_id: programId,
  });

  if (scoresError || !scores || scores.length === 0) {
    return { success: false, error: "Could not read scores to calculate results." };
  }

  const totalsByStudent = new Map<string, { sum: number; count: number }>();
  // Per student, per criterion — only populated for programs with configured scoring
  // types (D-004's pure rankResults() stays total-only; this rides along separately).
  const criteriaByStudent = new Map<string, Map<string, { sum: number; count: number }>>();

  for (const row of scores) {
    const entry = totalsByStudent.get(row.student_id) ?? { sum: 0, count: 0 };
    entry.sum += row.score;
    entry.count += 1;
    totalsByStudent.set(row.student_id, entry);

    const criteriaScores =
      (row.criteria_scores as { criterion_id: string; score: number }[] | null) ?? [];
    if (criteriaScores.length > 0) {
      const acc = criteriaByStudent.get(row.student_id) ?? new Map();
      for (const cs of criteriaScores) {
        const c = acc.get(cs.criterion_id) ?? { sum: 0, count: 0 };
        c.sum += cs.score;
        c.count += 1;
        acc.set(cs.criterion_id, c);
      }
      criteriaByStudent.set(row.student_id, acc);
    }
  }

  const averages: StudentAverage[] = Array.from(totalsByStudent.entries()).map(
    ([student_id, { sum, count }]) => ({
      student_id,
      average_score: Math.round((sum / count) * 100) / 100,
    }),
  );

  const settings = await getScoreSettings();
  const ranked = rankResults(averages, {
    1: settings.firstPlacePoints,
    2: settings.secondPlacePoints,
    3: settings.thirdPlacePoints,
  });

  const rankedWithBreakdown = ranked.map((result) => {
    const acc = criteriaByStudent.get(result.student_id);
    const criteria_averages = acc
      ? Array.from(acc.entries()).map(([criterion_id, { sum, count }]) => ({
          criterion_id,
          average: Math.round((sum / count) * 100) / 100,
        }))
      : [];
    return { ...result, criteria_averages };
  });

  const { error: finalizeError } = await supabase.rpc("finalize_program_results", {
    p_program_id: programId,
    p_results: rankedWithBreakdown,
  });

  if (finalizeError) {
    return { success: false, error: "Could not save calculated results. Please try again." };
  }

  // D-003's pipeline keeps moving on its own: finalize_program_results (SQL, see
  // 20260803010000_finalize_auto_advance.sql) auto-starts the next queued program on
  // this program's stage as part of the same call. That has to live there rather than
  // here — this function is most often invoked by a judge's own RLS-scoped session
  // right after their submission completes scoring, and judges have no UPDATE policy
  // on `programs` at all, so a plain client-side update from here would silently fail
  // under RLS every time a judge (as opposed to an admin) was the one who completed it.

  return { success: true, data: null };
}

/** Results for a program, joined with the student's name for the admin review table. */
export async function listResults(programId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("results")
    .select("*, students(name, roll_number)")
    .eq("program_id", programId)
    .order("position", { ascending: true });

  if (error) {
    return [];
  }

  return data;
}

export type PublicResultRow = {
  id: string;
  position: number;
  points: number;
  programName: string;
  programCategory: string;
  groupName: string;
  groupPhotoUrl: string | null;
  updatedAt: string;
};

export type LatestResultStudentRow = {
  id: string;
  position: number;
  points: number;
  programName: string;
  programCategory: string;
  studentName: string;
  studentPhotoUrl: string | null;
  updatedAt: string;
};

/**
 * D-020 (docs/decisions.md): audience-facing "Latest Results" shows the student's own
 * name/photo — a deliberate widening of D-018's exception to D-017, applied here to
 * every podium finish across every published program (recency-sorted), not just the
 * single latest program's top 3. Returns `LatestResultStudentRow`, a distinct type from
 * `PublicResultRow`, same reasoning as `LatestWinnerStudentRow` — so `listProgramWinners`
 * and `listGroupLeaderboard` (still D-017 house-only) can't accidentally start returning
 * student data just by sharing a shape. No new grant needed: reuses the
 * `grant select (name, photo_url) on students to anon` already in place for D-018.
 *
 * RLS already restricts `results` to published programs for an anonymous caller
 * (D-003), so no explicit status filter is needed here — the same query run by an admin
 * session would also see unpublished rows, which is why this is a distinct function
 * from listResults() rather than a shared one.
 */
export async function listLatestPublishedResults(limit = 10): Promise<LatestResultStudentRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("results")
    .select("id, position, points, updated_at, programs(name, category), students(name, photo_url)")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("listLatestPublishedResults failed:", error.message);
    return [];
  }

  return data.flatMap((row) => {
    const student = row.students;
    if (!row.programs || !student) {
      return [];
    }
    return [
      {
        id: row.id,
        position: row.position,
        points: row.points,
        programName: row.programs.name,
        programCategory: row.programs.category,
        studentName: student.name,
        studentPhotoUrl: student.photo_url,
        updatedAt: row.updated_at,
      },
    ];
  });
}

/**
 * D-017 (same house-name-only contract as listLatestPublishedResults): every
 * published program's 1st-place winner, one row per program — the audience page's
 * "Program Winners" section. Distinct from the latest-activity feed above, which is
 * recency-sorted and includes every podium position, not just firsts. Sorted by
 * category (in the app's kids/junior/senior order, not alphabetical) then program
 * name in JS rather than at the DB level — PostgREST only honors `.order()` on a
 * joined table when that join is `!inner` (this one deliberately isn't, so a program
 * missing a group/photo is skipped via flatMap below rather than dropping the row).
 */
export async function listProgramWinners(): Promise<PublicResultRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("results")
    .select(
      "id, position, points, updated_at, programs(name, category), students(main_groups(name, photo_url))",
    )
    .eq("position", 1);

  if (error) {
    console.error("listProgramWinners failed:", error.message);
    return [];
  }

  const winners = data.flatMap((row) => {
    const group = row.students?.main_groups;
    if (!row.programs || !group) {
      return [];
    }
    return [
      {
        id: row.id,
        position: row.position,
        points: row.points,
        programName: row.programs.name,
        programCategory: row.programs.category,
        groupName: group.name,
        groupPhotoUrl: group.photo_url,
        updatedAt: row.updated_at,
      },
    ];
  });

  return winners.sort((a, b) => {
    const categoryDiff =
      (CATEGORY_ORDER.get(a.programCategory) ?? 0) - (CATEGORY_ORDER.get(b.programCategory) ?? 0);
    return categoryDiff !== 0 ? categoryDiff : a.programName.localeCompare(b.programName);
  });
}

export type LatestWinnerStudentRow = {
  id: string;
  position: number;
  points: number;
  programName: string;
  programCategory: string;
  studentName: string;
  studentPhotoUrl: string | null;
  updatedAt: string;
};

/**
 * D-018 (docs/decisions.md): a deliberate, narrow EXCEPTION to D-017's house-only
 * contract — the audience "Latest Winner" podium shows the actual student's own name
 * and photo, not their house. Explicitly requested and confirmed by the user after
 * being shown the consequence (public, unauthenticated exposure of student identity).
 * Requires `students.name`/`photo_url` to be readable by anon
 * (`supabase/migrations/20260803020000_latest_winner_student_details.sql`) — every
 * OTHER audience-facing function in this file stays on the house-only contract and
 * does not need that grant. Returns a distinct type (`LatestWinnerStudentRow`, not
 * `PublicResultRow`) specifically so this one exception can never be confused with, or
 * accidentally substituted into, a call site that expects the D-017-compliant shape.
 *
 * The top 3 positions of the single most-recently-published program — a focused "who
 * just won" podium, distinct from listLatestPublishedResults' recency feed across every
 * program and from listProgramWinners' full every-program list. Two queries: find which
 * program was updated most recently, then read that program's own top 3 by position.
 */
export async function listLatestProgramPodium(): Promise<LatestWinnerStudentRow[]> {
  const supabase = await createClient();

  const { data: latest, error: latestError } = await supabase
    .from("results")
    .select("program_id")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestError || !latest) {
    return [];
  }

  const { data, error } = await supabase
    .from("results")
    .select("id, position, points, updated_at, programs(name, category), students(name, photo_url)")
    .eq("program_id", latest.program_id)
    .lte("position", 3)
    .order("position", { ascending: true });

  if (error) {
    console.error("listLatestProgramPodium failed:", error.message);
    return [];
  }

  return data.flatMap((row) => {
    const student = row.students;
    if (!row.programs || !student) {
      return [];
    }
    return [
      {
        id: row.id,
        position: row.position,
        points: row.points,
        programName: row.programs.name,
        programCategory: row.programs.category,
        studentName: student.name,
        studentPhotoUrl: student.photo_url,
        updatedAt: row.updated_at,
      },
    ];
  });
}

export type StudentSearchResult = {
  studentId: string;
  studentName: string;
  results: {
    id: string;
    programName: string;
    programCategory: string;
    position: number;
    points: number;
    updatedAt: string;
  }[];
};

/**
 * D-019 (docs/decisions.md): "Find My Result" — a lookup-only exception to D-017,
 * distinct from D-018's public podium. `search_student_results` is a SECURITY DEFINER
 * RPC (supabase/migrations/20260804000000_search_student_results.sql) that matches the
 * query against a student's exact roll number or their name (min 3 characters, capped
 * at 5 students) and returns only that student's own published results — a caller must
 * already know who they're looking for; nothing here is browsable. Grouped by student
 * here (the RPC returns one flat row per result) since a name search can match more
 * than one student.
 */
export async function searchStudentResults(query: string): Promise<StudentSearchResult[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_student_results", { p_query: query });

  if (error) {
    console.error("searchStudentResults failed:", error.message);
    return [];
  }

  const byStudent = new Map<string, StudentSearchResult>();
  for (const row of data) {
    const entry = byStudent.get(row.student_id) ?? {
      studentId: row.student_id,
      studentName: row.student_name,
      results: [],
    };
    entry.results.push({
      id: `${row.student_id}-${row.program_name}-${row.updated_at}`,
      programName: row.program_name,
      programCategory: row.program_category,
      position: row.result_position,
      points: row.points,
      updatedAt: row.updated_at,
    });
    byStudent.set(row.student_id, entry);
  }

  return Array.from(byStudent.values());
}

/**
 * D-003's manual gate: admin reviews the calculated results, then publishes.
 *
 * `status = 'completed'` alone doesn't guarantee a `results` row exists — fixture.service.ts's
 * overrideProgramStatus() is an admin escape hatch that can force a program straight to
 * 'completed' (e.g. "a judge never submits") without ever calling finalize_program_results,
 * so this re-checks for at least one result row before allowing the publish. Otherwise a
 * program with zero results could be marked 'published' and every audience-facing read
 * (leaderboard, program winners, latest results) would silently show nothing for it —
 * not a crash, just an empty page with no indication why.
 */
export async function publishProgram(programId: string): Promise<ServiceResult<null>> {
  const supabase = await createClient();

  const { count } = await supabase
    .from("results")
    .select("id", { count: "exact", head: true })
    .eq("program_id", programId);

  if (!count) {
    return {
      success: false,
      error: "This program has no calculated results yet — recalculate before publishing.",
    };
  }

  const { error } = await supabase
    .from("programs")
    .update({ status: "published" })
    .eq("id", programId)
    .eq("status", "completed")
    .select()
    .single();

  if (error) {
    return {
      success: false,
      error: "Could not publish results — results may not be calculated for this program yet.",
    };
  }

  return { success: true, data: null };
}
