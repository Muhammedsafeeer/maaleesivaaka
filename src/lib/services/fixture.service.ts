import { createClient, createAnonClient } from "@/lib/supabase/server";
import type { Program, FixtureBreak, FixtureBreakStatus } from "@/types/program";
import type { StageType, ProgramStatus } from "@/constants/programs";

/** A merged, running-order-sorted view of programs and breaks for one stage — what
 * listFixture returns and FixtureList renders. A break is a "dummy row" (no students,
 * judges, category, or scoring) that otherwise shares the exact same running-order
 * mechanics as a program: draggable, one-current-entry-per-stage, auto-advance. */
export type FixtureEntry =
  | { kind: "program"; id: string; serialNumber: number | null; status: ProgramStatus; program: Program }
  | { kind: "break"; id: string; serialNumber: number | null; status: FixtureBreakStatus; brk: FixtureBreak };

export type RosterStudent = {
  id: string;
  name: string;
  roll_number: string;
  photo_url: string | null;
  scoredJudgeCount: number;
};

/** A group program's "performing now" unit (D-025 follow-up) — one team entry, not one
 * student, since scoring happens once per team. */
export type RosterTeam = {
  id: string;
  groupName: string;
  chestNumber: string;
  scoredJudgeCount: number;
};

export type ProgramRoster = {
  students: RosterStudent[];
  teams: RosterTeam[];
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
 * subset of statuses, across BOTH programs and fixture_breaks — they share one
 * numbering space per stage, so a freshly-queued program or break always lands after
 * everything already scheduled (of either kind) rather than colliding with an
 * existing number. `statuses` is matched against both tables identically; breaks never
 * hold 'draft'/'published' so passing those just naturally excludes every break.
 */
async function maxSerialNumber(
  supabase: SupabaseServerClient,
  stageType: StageType,
  statuses?: readonly ProgramStatus[],
): Promise<number> {
  let programQuery = supabase
    .from("programs")
    .select("serial_number")
    .eq("stage_type", stageType)
    .not("serial_number", "is", null);
  if (statuses) {
    programQuery = programQuery.in("status", statuses);
  }

  let breakQuery = supabase
    .from("fixture_breaks")
    .select("serial_number")
    .eq("stage_type", stageType)
    .not("serial_number", "is", null);
  if (statuses) {
    breakQuery = breakQuery.in("status", statuses);
  }

  const [{ data: programMax }, { data: breakMax }] = await Promise.all([
    programQuery.order("serial_number", { ascending: false }).limit(1).maybeSingle(),
    breakQuery.order("serial_number", { ascending: false }).limit(1).maybeSingle(),
  ]);

  return Math.max(programMax?.serial_number ?? 0, breakMax?.serial_number ?? 0);
}

/** 'published' sorts first, then 'completed', then 'scoring' — see listFixture. A
 * break is never 'published', so it only ever falls in the lowest-priority bucket
 * alongside 'upcoming', sorted purely by serial_number. */
const FIXTURE_STATUS_PRIORITY: Partial<Record<ProgramStatus, number>> = {
  published: 0,
  completed: 1,
  scoring: 2,
};

function fixtureEntryName(entry: FixtureEntry): string {
  return entry.kind === "program" ? entry.program.name : entry.brk.label;
}

/**
 * Every program AND break for a stage, merged into one running order (nulls-last on
 * serial_number, then name as a stable tiebreaker) — EXCEPT 'published' programs,
 * which always sort first, 'completed' right after them, then 'scoring' (whichever
 * entry is actually on stage right now, program or break) — all three regardless of
 * where their serial number falls, so none of them is ever buried mid-list on a long
 * fixture behind a wall of still-upcoming entries. Admin-requested, same priority on
 * both stage tabs. Supabase's `.order()` doesn't support a secondary nullsFirst
 * independent of the first column's direction across two different columns in one
 * call reliably across all client versions, so this sorts client-side instead of
 * chaining two `.order()`s.
 */
export async function listFixture(stageType: StageType): Promise<FixtureEntry[]> {
  const supabase = await createClient();
  const [{ data: programs, error: programsError }, { data: breaks, error: breaksError }] =
    await Promise.all([
      supabase.from("programs").select("*").eq("stage_type", stageType),
      supabase.from("fixture_breaks").select("*").eq("stage_type", stageType),
    ]);

  if (programsError || breaksError) {
    return [];
  }

  const entries: FixtureEntry[] = [
    ...programs.map(
      (program): FixtureEntry => ({
        kind: "program",
        id: program.id,
        serialNumber: program.serial_number,
        status: program.status,
        program,
      }),
    ),
    ...breaks.map(
      (brk): FixtureEntry => ({
        kind: "break",
        id: brk.id,
        serialNumber: brk.serial_number,
        status: brk.status as FixtureBreakStatus,
        brk,
      }),
    ),
  ];

  return entries.sort((a, b) => {
    const aPriority = FIXTURE_STATUS_PRIORITY[a.status as ProgramStatus] ?? 3;
    const bPriority = FIXTURE_STATUS_PRIORITY[b.status as ProgramStatus] ?? 3;
    if (aPriority !== bPriority) return aPriority - bPriority;

    if (a.serialNumber === b.serialNumber) {
      return fixtureEntryName(a).localeCompare(fixtureEntryName(b));
    }
    if (a.serialNumber === null) return 1;
    if (b.serialNumber === null) return -1;
    return a.serialNumber - b.serialNumber;
  });
}

/**
 * The break currently active on each stage, if any — the public "Now Performing"
 * counterpart to `listPrograms({status: "scoring"})` on /audience and /tv. Uses
 * createAnonClient() (not the request's own session) for the same reason every other
 * /audience-/tv-/g-only query in this codebase does: a staff member simply logged in
 * as admin/judge on the same browser previewing one of those pages shouldn't see
 * anything different than a genuinely anonymous visitor would. Breaks have no
 * sensitive fields, so unlike results this isn't a correctness fix, just consistency —
 * see createAnonClient's own comment.
 */
export async function listCurrentFixtureBreaks(): Promise<FixtureBreak[]> {
  const supabase = createAnonClient();
  const { data, error } = await supabase.from("fixture_breaks").select("*").eq("status", "scoring");

  if (error) {
    console.error("listCurrentFixtureBreaks failed:", error.message);
    return [];
  }

  return data;
}

/**
 * Starts the lowest-serial 'upcoming' entry for a stage — a program OR a break,
 * whichever comes first in the running order — sending it straight to 'scoring'
 * (performance/break and "current" are one admin-facing step; judges can score a
 * program while it's in this state). Refuses if that stage already has a current
 * entry of either kind, so a stage only ever has one "on stage" entry at a time.
 */
export async function startNextFixtureEntry(stageType: StageType): Promise<ServiceResult<null>> {
  const supabase = await createClient();

  const [{ data: currentProgram }, { data: currentBreak }] = await Promise.all([
    supabase
      .from("programs")
      .select("id")
      .eq("stage_type", stageType)
      .in("status", CURRENT_STATUSES)
      .limit(1)
      .maybeSingle(),
    supabase
      .from("fixture_breaks")
      .select("id")
      .eq("stage_type", stageType)
      .in("status", CURRENT_STATUSES)
      .limit(1)
      .maybeSingle(),
  ]);

  if (currentProgram || currentBreak) {
    return {
      success: false,
      error: STAGE_ALREADY_HAS_A_CURRENT_PROGRAM,
    };
  }

  const [{ data: nextProgram }, { data: nextBreak }] = await Promise.all([
    supabase
      .from("programs")
      .select("id, serial_number")
      .eq("stage_type", stageType)
      .eq("status", "upcoming")
      .not("serial_number", "is", null)
      .order("serial_number", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("fixture_breaks")
      .select("id, serial_number")
      .eq("stage_type", stageType)
      .eq("status", "upcoming")
      .not("serial_number", "is", null)
      .order("serial_number", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  // Whichever of the two candidates has the lower serial number is next — a break
  // sitting between two programs has to actually take its turn, not be skipped.
  const next =
    nextProgram && (!nextBreak || nextProgram.serial_number! <= nextBreak.serial_number!)
      ? { table: "programs" as const, id: nextProgram.id }
      : nextBreak
        ? { table: "fixture_breaks" as const, id: nextBreak.id }
        : null;

  if (!next) {
    return {
      success: false,
      error: NO_UPCOMING_PROGRAM_QUEUED,
    };
  }

  const { error } = await supabase.from(next.table).update({ status: "scoring" }).eq("id", next.id);

  if (error) {
    return { success: false, error: "Could not start the next entry. Please try again." };
  }

  return { success: true, data: null };
}

/**
 * Admin escape hatch for the otherwise-automatic status pipeline (e.g. a judge never
 * submits, or a program was started by mistake). Deliberately can't set 'published' —
 * that stays behind publishProgram()'s "results must be calculated" gate. A program
 * that's already published is otherwise locked from this override too (a public result
 * can't be silently changed from here) EXCEPT the two admin-requested recovery paths
 * for an accidental publish: back to 'scoring' (reopen for rescoring) or 'upcoming' (a
 * full reset) — see ResultsPanel's "Unpublish" control, the only place these are
 * reachable from.
 *
 * Setting a program to 'scoring' is otherwise blocked while another program on the same
 * stage is already current, so this can't put two programs "on stage" at once — except
 * reopening a published one for rescoring, which skips that check (it already had its
 * turn; it isn't going back "on stage").
 *
 * Serial numbers are never typed in by hand (see reorderUpcoming): moving a program to
 * 'upcoming' auto-assigns it the next serial in the stage if it doesn't already have
 * one, and moving it back to 'draft' clears its serial — it leaves the running order
 * entirely rather than holding a stale slot in it.
 *
 * Reaching 'completed' this way auto-starts the next queued entry on the same stage —
 * a program OR a break, whichever is next (see startNextFixtureEntry below) — so a
 * program forced to 'completed' via this escape hatch doesn't leave the stage stuck
 * idle just because it skipped the usual finalization route.
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

  // A published program is otherwise locked from this override (it's live for the
  // audience, not something to nudge via the Fixture page's quick status dropdown) —
  // except these two admin-requested recovery paths for an accidental publish:
  // 'scoring' (reopen so a judge can rescore) or 'upcoming' (a full reset). Both are
  // deliberately only reachable from the program's own detail page (ResultsPanel's
  // "Unpublish" control), never the Fixture list's inline dropdown, which still hides
  // published programs entirely (see FixtureRow).
  if (existing.status === "published" && status !== "scoring" && status !== "upcoming") {
    return {
      success: false,
      error: "This program is already published — manage it from the program page instead.",
    };
  }

  // Admin-requested guard: this override is an escape hatch (e.g. "a judge never
  // submits") that skips finalize_program_results entirely, so nothing else stops an
  // admin from force-completing a program nobody actually scored — every student would
  // land tied for 1st with full points the moment results got calculated. Requiring at
  // least one score above 0 first doesn't block the normal case (a judge partially
  // scoring, the rest defaulting to 0 per the scoring form's own floor) — it only
  // blocks completing a program that's genuinely all zero.
  if (status === "completed") {
    const { count: scoredCount } = await supabase
      .from("judge_scores")
      .select("id", { count: "exact", head: true })
      .eq("program_id", programId)
      .gt("score", 0);

    if (!scoredCount) {
      return {
        success: false,
        error: "No student has a score above 0 yet — score at least one before marking this program completed.",
      };
    }
  }

  // Reopening a PUBLISHED program for rescoring isn't putting it back "on stage" — it
  // already had its turn and finished — so it skips this conflict check entirely.
  // Without this exception, reopening one almost always failed in practice: there's
  // usually some other program genuinely on stage for the same stage_type at any given
  // moment, which isn't actually a conflict with a program that's just having a score
  // corrected.
  const isReopenForRescoring = existing.status === "published" && status === "scoring";

  if (!isReopenForRescoring && CURRENT_STATUSES.includes(status as (typeof CURRENT_STATUSES)[number])) {
    const [{ data: currentProgram }, { data: currentBreak }] = await Promise.all([
      supabase
        .from("programs")
        .select("id")
        .eq("stage_type", existing.stage_type)
        .in("status", CURRENT_STATUSES)
        .neq("id", programId)
        .limit(1)
        .maybeSingle(),
      supabase
        .from("fixture_breaks")
        .select("id")
        .eq("stage_type", existing.stage_type)
        .in("status", CURRENT_STATUSES)
        .limit(1)
        .maybeSingle(),
    ]);

    if (currentProgram || currentBreak) {
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
    const advanceResult = await startNextFixtureEntry(existing.stage_type);
    if (
      !advanceResult.success &&
      advanceResult.error !== NO_UPCOMING_PROGRAM_QUEUED &&
      advanceResult.error !== STAGE_ALREADY_HAS_A_CURRENT_PROGRAM
    ) {
      console.error("startNextFixtureEntry failed after overrideProgramStatus:", advanceResult.error);
    }
  }

  return { success: true, data };
}

export type FixtureEntryRef = { id: string; kind: "program" | "break" };

/**
 * Applies a drag-and-drop reorder from the Fixture page, over a MIXED list of programs
 * and breaks. Only 'upcoming' entries of either kind can be dragged — anything that's
 * already scoring, completed, or published has already had its turn and keeps its
 * original serial number, so `orderedEntries` must be exactly the stage's current
 * 'upcoming' set (of both kinds, checked below) in its new order. Renumbers them
 * sequentially starting right after the highest serial number already locked in by a
 * settled (scoring/completed/published) entry, so the new order can never collide
 * with, or sort ahead of, an entry that's already had its turn.
 */
export async function reorderUpcoming(
  stageType: StageType,
  orderedEntries: FixtureEntryRef[],
): Promise<ServiceResult<null>> {
  const supabase = await createClient();

  if (orderedEntries.length === 0) {
    return { success: true, data: null };
  }

  const programIds = orderedEntries.filter((e) => e.kind === "program").map((e) => e.id);
  const breakIds = orderedEntries.filter((e) => e.kind === "break").map((e) => e.id);

  const [{ data: programRows, error: programError }, { data: breakRows, error: breakError }] =
    await Promise.all([
      programIds.length > 0
        ? supabase.from("programs").select("id, stage_type, status").in("id", programIds)
        : Promise.resolve({ data: [] as { id: string; stage_type: string; status: string }[], error: null }),
      breakIds.length > 0
        ? supabase.from("fixture_breaks").select("id, stage_type, status").in("id", breakIds)
        : Promise.resolve({ data: [] as { id: string; stage_type: string; status: string }[], error: null }),
    ]);

  if (
    programError ||
    breakError ||
    !programRows ||
    !breakRows ||
    programRows.length !== programIds.length ||
    breakRows.length !== breakIds.length
  ) {
    return {
      success: false,
      error: "Could not reorder — the running order changed. Refresh and try again.",
    };
  }

  const allUpcomingInStage = [...programRows, ...breakRows].every(
    (row) => row.stage_type === stageType && row.status === "upcoming",
  );

  if (!allUpcomingInStage) {
    return {
      success: false,
      error: "Only upcoming entries can be reordered.",
    };
  }

  let next = (await maxSerialNumber(supabase, stageType, SETTLED_STATUSES)) + 1;

  for (const entry of orderedEntries) {
    const table = entry.kind === "program" ? "programs" : "fixture_breaks";
    const { error: updateError } = await supabase
      .from(table)
      .update({ serial_number: next })
      .eq("id", entry.id);

    if (updateError) {
      return { success: false, error: "Could not save the new running order. Please try again." };
    }

    next += 1;
  }

  return { success: true, data: null };
}

/**
 * Appends a new break to the end of a stage's upcoming running order — admin drags it
 * into its actual position afterward via the same reorderUpcoming path a program uses.
 */
export async function createFixtureBreak(
  stageType: StageType,
  label: string,
): Promise<ServiceResult<FixtureBreak>> {
  const supabase = await createClient();
  const serialNumber = (await maxSerialNumber(supabase, stageType)) + 1;

  const { data, error } = await supabase
    .from("fixture_breaks")
    .insert({ stage_type: stageType, label: label.trim() || "Break", serial_number: serialNumber })
    .select()
    .single();

  if (error || !data) {
    return { success: false, error: "Could not add the break. Please try again." };
  }

  return { success: true, data };
}

export async function deleteFixtureBreak(breakId: string): Promise<ServiceResult<null>> {
  const supabase = await createClient();
  const { error } = await supabase.from("fixture_breaks").delete().eq("id", breakId);

  if (error) {
    return { success: false, error: "Could not remove the break. Please try again." };
  }

  return { success: true, data: null };
}

/**
 * Admin-only status control for a break — same "only one current entry per stage"
 * conflict check as overrideProgramStatus, and the same auto-start-next-entry on
 * 'completed', but none of that function's program-specific rules (no zero-score
 * guard, no published lock, no draft/serial-clearing branch — a break never leaves
 * 'draft'/'published' at all).
 */
export async function overrideBreakStatus(
  breakId: string,
  status: FixtureBreakStatus,
): Promise<ServiceResult<FixtureBreak>> {
  const supabase = await createClient();

  const { data: existing, error: readError } = await supabase
    .from("fixture_breaks")
    .select("stage_type, serial_number")
    .eq("id", breakId)
    .single();

  if (readError || !existing) {
    return { success: false, error: "Could not find that break." };
  }

  if (status === "scoring") {
    const [{ data: currentProgram }, { data: currentBreak }] = await Promise.all([
      supabase
        .from("programs")
        .select("id")
        .eq("stage_type", existing.stage_type)
        .in("status", CURRENT_STATUSES)
        .limit(1)
        .maybeSingle(),
      supabase
        .from("fixture_breaks")
        .select("id")
        .eq("stage_type", existing.stage_type)
        .in("status", CURRENT_STATUSES)
        .neq("id", breakId)
        .limit(1)
        .maybeSingle(),
    ]);

    if (currentProgram || currentBreak) {
      return {
        success: false,
        error: "Another program on this stage is already on stage — finish or move it first.",
      };
    }
  }

  const update: { status: FixtureBreakStatus; serial_number?: number } = { status };
  if (status === "upcoming" && existing.serial_number === null) {
    update.serial_number = (await maxSerialNumber(supabase, existing.stage_type)) + 1;
  }

  const { data, error } = await supabase
    .from("fixture_breaks")
    .update(update)
    .eq("id", breakId)
    .select()
    .single();

  if (error || !data) {
    return { success: false, error: "Could not update the break. Please try again." };
  }

  if (status === "completed") {
    const advanceResult = await startNextFixtureEntry(existing.stage_type);
    if (
      !advanceResult.success &&
      advanceResult.error !== NO_UPCOMING_PROGRAM_QUEUED &&
      advanceResult.error !== STAGE_ALREADY_HAS_A_CURRENT_PROGRAM
    ) {
      console.error("startNextFixtureEntry failed after overrideBreakStatus:", advanceResult.error);
    }
  }

  return { success: true, data };
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
export async function listProgramRoster(programId: string, isGroup = false): Promise<ProgramRoster> {
  const supabase = await createClient();

  const [{ count: totalJudges }, { data: scores }] = await Promise.all([
    supabase
      .from("program_judges")
      .select("judge_id", { count: "exact", head: true })
      .eq("program_id", programId),
    supabase
      .from("judge_scores")
      .select("student_id, group_entry_id")
      .eq("program_id", programId),
  ]);

  // Group programs (D-025 follow-up): the "performing now" unit is a team entry, not a
  // student — scoring happens once per team, so per-student judge_scores rows never
  // exist for a group program and would leave every student stuck at scoredJudgeCount 0.
  if (isGroup) {
    const { data: entries, error } = await supabase
      .from("program_group_entries")
      .select("id, chest_number, main_groups(name)")
      .eq("program_id", programId)
      .order("created_at", { ascending: true });

    if (error || !entries) {
      return { students: [], teams: [], totalJudges: totalJudges ?? 0 };
    }

    const scoredCountByEntry = new Map<string, number>();
    for (const row of scores ?? []) {
      if (!row.group_entry_id) continue;
      scoredCountByEntry.set(row.group_entry_id, (scoredCountByEntry.get(row.group_entry_id) ?? 0) + 1);
    }

    const teams = entries.map((entry) => ({
      id: entry.id,
      groupName: entry.main_groups?.name ?? "Unknown house",
      chestNumber: entry.chest_number,
      scoredJudgeCount: scoredCountByEntry.get(entry.id) ?? 0,
    }));

    return { students: [], teams, totalJudges: totalJudges ?? 0 };
  }

  const { data: assigned, error: assignedError } = await supabase
    .from("program_students")
    .select("students(id, name, roll_number, photo_url)")
    .eq("program_id", programId)
    .order("created_at", { ascending: true });

  if (assignedError || !assigned) {
    return { students: [], teams: [], totalJudges: totalJudges ?? 0 };
  }

  const scoredCountByStudent = new Map<string, number>();
  for (const row of scores ?? []) {
    if (!row.student_id) continue;
    scoredCountByStudent.set(row.student_id, (scoredCountByStudent.get(row.student_id) ?? 0) + 1);
  }

  const students = assigned.flatMap((row) =>
    row.students
      ? [{ ...row.students, scoredJudgeCount: scoredCountByStudent.get(row.students.id) ?? 0 }]
      : [],
  );

  return { students, teams: [], totalJudges: totalJudges ?? 0 };
}
