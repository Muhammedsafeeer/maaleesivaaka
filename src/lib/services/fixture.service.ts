import { createClient } from "@/lib/supabase/server";
import type { Program } from "@/types/program";
import type { StageType, ProgramStatus } from "@/constants/programs";

export type RosterStudent = {
  id: string;
  name: string;
  roll_number: string;
  photo_url: string | null;
  scoredJudgeCount: number;
};

export type ProgramRoster = {
  students: RosterStudent[];
  totalJudges: number;
};

export type ServiceResult<T> = { success: true; data: T } | { success: false; error: string };

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/** The one status a stage's "current" (on-stage-and-being-scored) program can be in. */
const CURRENT_STATUSES = ["scoring"] as const;

/** Statuses that have already had their turn — their serial number is permanent. */
const SETTLED_STATUSES = ["scoring", "completed", "published"] as const;

/**
 * startNextProgram()'s two "nothing to do" outcomes — not real errors, just the normal
 * end state of a stage (nothing left queued) or of a duplicate auto-advance attempt
 * (already started). Exported so callers that trigger it automatically (below, and
 * result.service.ts's finalizeIfComplete) can tell those apart from a genuine failure
 * worth logging.
 */
export const NO_UPCOMING_PROGRAM_QUEUED =
  "No upcoming program with a serial number is queued on this stage.";
export const STAGE_ALREADY_HAS_A_CURRENT_PROGRAM =
  "Finish the current program on this stage before starting the next one.";

/**
 * Highest serial number already claimed in this stage, optionally restricted to a
 * subset of statuses. The base to count up from when a program joins or rejoins the
 * running order, so a freshly-queued program always lands after everything already
 * scheduled rather than colliding with an existing number.
 */
async function maxSerialNumber(
  supabase: SupabaseServerClient,
  stageType: StageType,
  statuses?: readonly ProgramStatus[],
): Promise<number> {
  let query = supabase
    .from("programs")
    .select("serial_number")
    .eq("stage_type", stageType)
    .not("serial_number", "is", null);

  if (statuses) {
    query = query.in("status", statuses);
  }

  const { data } = await query
    .order("serial_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data?.serial_number ?? 0;
}

/**
 * Every program for a stage, in running order (nulls-last on serial_number, then
 * name as a stable tiebreaker for programs that share a serial or have none yet).
 * Supabase's `.order()` doesn't support a secondary nullsFirst independent of the
 * first column's direction across two different columns in one call reliably across
 * all client versions, so this sorts client-side instead of chaining two `.order()`s.
 */
export async function listFixture(stageType: StageType): Promise<Program[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("programs")
    .select("*")
    .eq("stage_type", stageType);

  if (error) {
    return [];
  }

  return [...data].sort((a, b) => {
    if (a.serial_number === b.serial_number) {
      return a.name.localeCompare(b.name);
    }
    if (a.serial_number === null) return 1;
    if (b.serial_number === null) return -1;
    return a.serial_number - b.serial_number;
  });
}

/**
 * Starts the lowest-serial 'upcoming' program for a stage, sending it straight to
 * 'scoring' (performance and scoring are one admin-facing step — judges can score while
 * the program is on stage). Refuses if that stage already has a current program, so a
 * stage only ever has one "on stage" program at a time.
 */
export async function startNextProgram(stageType: StageType): Promise<ServiceResult<Program>> {
  const supabase = await createClient();

  const { data: current } = await supabase
    .from("programs")
    .select("id")
    .eq("stage_type", stageType)
    .in("status", CURRENT_STATUSES)
    .limit(1)
    .maybeSingle();

  if (current) {
    return {
      success: false,
      error: STAGE_ALREADY_HAS_A_CURRENT_PROGRAM,
    };
  }

  const { data: next, error: nextError } = await supabase
    .from("programs")
    .select("id")
    .eq("stage_type", stageType)
    .eq("status", "upcoming")
    .not("serial_number", "is", null)
    .order("serial_number", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (nextError || !next) {
    return {
      success: false,
      error: NO_UPCOMING_PROGRAM_QUEUED,
    };
  }

  const { data, error } = await supabase
    .from("programs")
    .update({ status: "scoring" })
    .eq("id", next.id)
    .select()
    .single();

  if (error) {
    return { success: false, error: "Could not start the next program. Please try again." };
  }

  return { success: true, data };
}

/**
 * Admin escape hatch for the otherwise-automatic status pipeline (e.g. a judge never
 * submits, or a program was started by mistake). Deliberately can't set 'published' —
 * that stays behind publishProgram()'s "results must be calculated" gate — and can't
 * touch a program that's already published, so a public result can't be silently
 * changed from here. Setting a program to 'scoring' is still blocked while another
 * program on the same stage is already current, so this can't put two programs "on
 * stage" at once.
 *
 * Serial numbers are never typed in by hand (see reorderUpcoming): moving a program to
 * 'upcoming' auto-assigns it the next serial in the stage if it doesn't already have
 * one, and moving it back to 'draft' clears its serial — it leaves the running order
 * entirely rather than holding a stale slot in it.
 *
 * Reaching 'completed' this way auto-starts the next queued program on the same stage
 * (see startNextProgram below), same as the normal finalize-on-full-scoring path
 * (result.service.ts's finalizeIfComplete) — a program forced to 'completed' via this
 * escape hatch shouldn't leave the stage stuck idle just because it skipped the usual
 * finalization route.
 */
export async function overrideProgramStatus(
  programId: string,
  status: Exclude<ProgramStatus, "published">,
): Promise<ServiceResult<Program>> {
  const supabase = await createClient();

  const { data: existing, error: readError } = await supabase
    .from("programs")
    .select("stage_type, status, serial_number")
    .eq("id", programId)
    .single();

  if (readError || !existing) {
    return { success: false, error: "Could not find that program." };
  }

  if (existing.status === "published") {
    return {
      success: false,
      error: "This program is already published — manage it from the program page instead.",
    };
  }

  if (CURRENT_STATUSES.includes(status as (typeof CURRENT_STATUSES)[number])) {
    const { data: current } = await supabase
      .from("programs")
      .select("id")
      .eq("stage_type", existing.stage_type)
      .in("status", CURRENT_STATUSES)
      .neq("id", programId)
      .limit(1)
      .maybeSingle();

    if (current) {
      return {
        success: false,
        error: "Another program on this stage is already on stage — finish or move it first.",
      };
    }
  }

  const update: { status: ProgramStatus; serial_number?: number | null } = { status };

  if (status === "draft") {
    update.serial_number = null;
  } else if (status === "upcoming" && existing.serial_number === null) {
    update.serial_number = (await maxSerialNumber(supabase, existing.stage_type)) + 1;
  }

  const { data, error } = await supabase
    .from("programs")
    .update(update)
    .eq("id", programId)
    .select()
    .single();

  if (error) {
    return { success: false, error: "Could not update the status. Please try again." };
  }

  if (status === "completed") {
    const advanceResult = await startNextProgram(existing.stage_type);
    if (
      !advanceResult.success &&
      advanceResult.error !== NO_UPCOMING_PROGRAM_QUEUED &&
      advanceResult.error !== STAGE_ALREADY_HAS_A_CURRENT_PROGRAM
    ) {
      console.error("startNextProgram failed after overrideProgramStatus:", advanceResult.error);
    }
  }

  return { success: true, data };
}

/**
 * Applies a drag-and-drop reorder from the Fixture page. Only 'upcoming' programs can
 * be dragged — anything that's already scoring, completed, or published has already had
 * its turn and keeps its original serial number, so `orderedIds` must be exactly the
 * stage's current 'upcoming' set (checked below) in its new order. Renumbers them
 * sequentially starting right after the highest serial number already locked in by a
 * settled (scoring/completed/published) program, so the new order can never collide
 * with, or sort ahead of, a program that's already had its turn.
 */
export async function reorderUpcoming(
  stageType: StageType,
  orderedIds: string[],
): Promise<ServiceResult<null>> {
  const supabase = await createClient();

  if (orderedIds.length === 0) {
    return { success: true, data: null };
  }

  const { data: rows, error } = await supabase
    .from("programs")
    .select("id, stage_type, status")
    .in("id", orderedIds);

  if (error || !rows || rows.length !== orderedIds.length) {
    return {
      success: false,
      error: "Could not reorder — the running order changed. Refresh and try again.",
    };
  }

  const allUpcomingInStage = rows.every(
    (row) => row.stage_type === stageType && row.status === "upcoming",
  );

  if (!allUpcomingInStage) {
    return {
      success: false,
      error: "Only upcoming programs can be reordered.",
    };
  }

  let next = (await maxSerialNumber(supabase, stageType, SETTLED_STATUSES)) + 1;

  for (const id of orderedIds) {
    const { error: updateError } = await supabase
      .from("programs")
      .update({ serial_number: next })
      .eq("id", id);

    if (updateError) {
      return { success: false, error: "Could not save the new running order. Please try again." };
    }

    next += 1;
  }

  return { success: true, data: null };
}

/**
 * The on-stage program's roster in performance order (program_students.created_at,
 * same ordering convention as listScorableStudents), each student annotated with how
 * many of the program's assigned judges have scored them so far. The Fixture page
 * derives "performing now" vs. "done" vs. "upcoming" from this: a student is done once
 * scoredJudgeCount reaches totalJudges, and the first not-yet-done student is the one
 * currently performing — there's no dedicated "on stage" flag per student, scoring
 * progress is the only live signal available.
 */
export async function listProgramRoster(programId: string): Promise<ProgramRoster> {
  const supabase = await createClient();

  const [{ data: assigned, error: assignedError }, { count: totalJudges }, { data: scores }] =
    await Promise.all([
      supabase
        .from("program_students")
        .select("students(id, name, roll_number, photo_url)")
        .eq("program_id", programId)
        .order("created_at", { ascending: true }),
      supabase
        .from("program_judges")
        .select("judge_id", { count: "exact", head: true })
        .eq("program_id", programId),
      supabase.from("judge_scores").select("student_id").eq("program_id", programId),
    ]);

  if (assignedError || !assigned) {
    return { students: [], totalJudges: totalJudges ?? 0 };
  }

  const scoredCountByStudent = new Map<string, number>();
  for (const row of scores ?? []) {
    scoredCountByStudent.set(row.student_id, (scoredCountByStudent.get(row.student_id) ?? 0) + 1);
  }

  const students = assigned.flatMap((row) =>
    row.students
      ? [{ ...row.students, scoredJudgeCount: scoredCountByStudent.get(row.students.id) ?? 0 }]
      : [],
  );

  return { students, totalJudges: totalJudges ?? 0 };
}
