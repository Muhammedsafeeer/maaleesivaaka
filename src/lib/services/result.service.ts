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

  const { data: program } = await supabase
    .from("programs")
    .select("participation_type")
    .eq("id", programId)
    .single();
  const isGroup = program?.participation_type === "group";

  const { data: scores, error: scoresError } = await supabase.rpc("get_program_scores", {
    p_program_id: programId,
  });

  if (scoresError || !scores || scores.length === 0) {
    return { success: false, error: "Could not read scores to calculate results." };
  }

  // Group programs (D-025 follow-up): a row's key is group_entry_id, not student_id,
  // since a team is scored once, not once per member. rankResults() itself is agnostic
  // to what its `student_id` field represents (it only sorts/ranks by average_score),
  // so this reuses it unchanged with the entry id passed through that field — kept as
  // `student_id` rather than renamed, per D-004's "stays a pure, untouched function".
  const totalsByTarget = new Map<string, { sum: number; count: number }>();
  // Per target, per criterion — only populated for programs with configured scoring
  // types (D-004's pure rankResults() stays total-only; this rides along separately).
  const criteriaByTarget = new Map<string, Map<string, { sum: number; count: number }>>();

  for (const row of scores) {
    const targetId = isGroup ? row.group_entry_id : row.student_id;
    if (!targetId) continue;

    const entry = totalsByTarget.get(targetId) ?? { sum: 0, count: 0 };
    entry.sum += row.score;
    entry.count += 1;
    totalsByTarget.set(targetId, entry);

    const criteriaScores =
      (row.criteria_scores as { criterion_id: string; score: number }[] | null) ?? [];
    if (criteriaScores.length > 0) {
      const acc = criteriaByTarget.get(targetId) ?? new Map();
      for (const cs of criteriaScores) {
        const c = acc.get(cs.criterion_id) ?? { sum: 0, count: 0 };
        c.sum += cs.score;
        c.count += 1;
        acc.set(cs.criterion_id, c);
      }
      criteriaByTarget.set(targetId, acc);
    }
  }

  const averages: StudentAverage[] = Array.from(totalsByTarget.entries()).map(
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
    const acc = criteriaByTarget.get(result.student_id);
    const criteria_averages = acc
      ? Array.from(acc.entries()).map(([criterion_id, { sum, count }]) => ({
          criterion_id,
          average: Math.round((sum / count) * 100) / 100,
        }))
      : [];
    // result.student_id actually holds the group_entry_id for a group program (see the
    // passthrough note above) — finalize_program_results (SQL) branches on the
    // program's own participation_type and reads whichever key it's handed.
    return isGroup
      ? {
          group_entry_id: result.student_id,
          average_score: result.average_score,
          position: result.position,
          points: result.points,
          criteria_averages,
        }
      : {
          student_id: result.student_id,
          average_score: result.average_score,
          position: result.position,
          points: result.points,
          criteria_averages,
        };
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

export type TiedParticipant = {
  resultId: string;
  name: string;
  studentId: string | null;
  groupEntryId: string | null;
};
export type TiedPositionGroup = { position: number; points: number; participants: TiedParticipant[] };

/**
 * A program's tied positions (two or more results sharing one `position`) — always
 * derived from `results` on read, never stored (D-002 precedent), so it's
 * correct-by-construction the moment a judge revises a score. Callable by an assigned
 * judge (new "judges can read results for their assigned programs" RLS policy,
 * 20260819050000) as well as admin — finalize_program_results (SQL) already refuses to
 * flip a tied program to 'completed', so this is what actually surfaces the block to
 * whoever's looking. A shared average_score of exactly 0 is excluded (same
 * 20260823000000_ignore_zero_score_ties.sql reasoning as the SQL side): that's a batch
 * of never-actually-scored participants, not a competitive tie worth flagging.
 */
export async function listTiedPositions(programId: string): Promise<TiedPositionGroup[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("results")
    .select(
      "id, position, points, average_score, student_id, group_entry_id, students(name), program_group_entries(chest_number, main_groups(name))",
    )
    .eq("program_id", programId)
    .order("position", { ascending: true });

  if (error || !data) {
    return [];
  }

  const byPosition = new Map<number, typeof data>();
  for (const row of data) {
    const list = byPosition.get(row.position) ?? [];
    list.push(row);
    byPosition.set(row.position, list);
  }

  return Array.from(byPosition.entries())
    .filter(([, rows]) => rows.length > 1 && rows[0].average_score !== 0)
    .map(([position, rows]) => ({
      position,
      points: rows[0].points,
      participants: rows.map((row) => ({
        resultId: row.id,
        studentId: row.student_id,
        groupEntryId: row.group_entry_id,
        name:
          row.students?.name ??
          `${row.program_group_entries?.main_groups?.name ?? "Team"} · Chest ${row.program_group_entries?.chest_number ?? "?"}`,
      })),
    }));
}

export type UnresolvedTieProgram = {
  programId: string;
  programName: string;
  programCategory: string;
  groups: TiedPositionGroup[];
};

/**
 * Every program across the whole festival currently blocked on a tie — the admin
 * dashboard's "needs a decision" panel. Admin-only in practice (full `results` access),
 * scoped to `status = 'scoring'` since a resolved/accepted tie's program has already
 * moved to 'completed' and stops needing attention. A shared average_score of exactly 0
 * is excluded (see listTiedPositions) — not a real competitive tie.
 */
export async function listUnresolvedTies(): Promise<UnresolvedTieProgram[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("results")
    .select(
      "id, program_id, position, points, average_score, student_id, group_entry_id, programs!inner(name, category, status), students(name), program_group_entries(chest_number, main_groups(name))",
    )
    .eq("programs.status", "scoring");

  if (error || !data) {
    return [];
  }

  const byProgramPosition = new Map<string, typeof data>();
  for (const row of data) {
    const key = `${row.program_id}:${row.position}`;
    const list = byProgramPosition.get(key) ?? [];
    list.push(row);
    byProgramPosition.set(key, list);
  }

  const byProgram = new Map<string, UnresolvedTieProgram>();
  for (const rows of byProgramPosition.values()) {
    if (rows.length < 2 || rows[0].average_score === 0) continue;

    const first = rows[0];
    if (!first.programs) continue;

    const entry = byProgram.get(first.program_id) ?? {
      programId: first.program_id,
      programName: first.programs.name,
      programCategory: first.programs.category,
      groups: [],
    };

    entry.groups.push({
      position: first.position,
      points: first.points,
      participants: rows.map((row) => ({
        resultId: row.id,
        studentId: row.student_id,
        groupEntryId: row.group_entry_id,
        name:
          row.students?.name ??
          `${row.program_group_entries?.main_groups?.name ?? "Team"} · Chest ${row.program_group_entries?.chest_number ?? "?"}`,
      })),
    });

    byProgram.set(first.program_id, entry);
  }

  return Array.from(byProgram.values());
}

/**
 * Results for a program, joined with the student's name for the admin review table.
 * Also carries class and house (main_groups) — not used by the review table itself, but
 * needed by PrintCertificatesDialog (src/features/programs/components) for the podium's
 * certificate details. Admin-only (RLS-scoped session), so this can safely include more
 * than the anon-facing functions below ever expose (D-017/D-019).
 */
export async function listResults(programId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("results")
    .select(
      "*, students(name, malayalam_name, roll_number, class, photo_url, main_groups(name)), program_group_entries(chest_number, main_groups(name))",
    )
    .eq("program_id", programId)
    .order("position", { ascending: true });

  if (error) {
    return [];
  }

  return data;
}

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * A group program's team results, expanded into one PodiumCertificateRow per team
 * member (D-025 follow-up) — a `results` row for a group program is keyed by
 * group_entry_id, one row per TEAM, but PrintCertificatesDialog/CertificatesBrowser
 * still print (and key everything off) one certificate per STUDENT. Member list comes
 * from program_students joined back to the entry's house, same "who's on this team"
 * query GroupRosterPanel already relies on — there's no per-student results row to read
 * instead. `maxPosition` mirrors the individual-side `.lte("position", 3)` filter its
 * caller applies.
 */
async function expandTeamResultsForCertificates(
  supabase: SupabaseServerClient,
  maxPosition?: number,
  programId?: string,
): Promise<PodiumCertificateRow[]> {
  let query = supabase
    .from("results")
    .select(
      "id, position, points, program_id, programs(name, category), program_group_entries(group_id, chest_number, main_groups(name))",
    )
    .not("group_entry_id", "is", null);

  if (maxPosition !== undefined) {
    query = query.lte("position", maxPosition);
  }
  if (programId !== undefined) {
    query = query.eq("program_id", programId);
  }

  const { data, error } = await query.order("position", { ascending: true });

  if (error) {
    console.error("expandTeamResultsForCertificates failed:", error.message);
    return [];
  }

  const teamRows = data.flatMap((row) => {
    const entry = row.program_group_entries;
    if (!entry || !row.programs) return [];
    return [{ ...row, entry, programs: row.programs }];
  });

  if (teamRows.length === 0) {
    return [];
  }

  const programIds = [...new Set(teamRows.map((r) => r.program_id))];

  const { data: memberRows, error: memberError } = await supabase
    .from("program_students")
    .select("program_id, students(id, name, malayalam_name, roll_number, class, photo_url, group_id)")
    .in("program_id", programIds);

  if (memberError || !memberRows) {
    return [];
  }

  return teamRows.flatMap((row) =>
    memberRows
      .filter((m) => m.program_id === row.program_id && m.students?.group_id === row.entry.group_id)
      .flatMap((m) => {
        const student = m.students;
        if (!student) return [];
        return [
          {
            // Composite, not the bare results.id — multiple students now share one
            // results row, and a bare id would collide across every certificate table
            // that keys rows by `id` (same reasoning searchStudentResults already uses).
            id: `${row.id}-${student.id}`,
            position: row.position,
            points: row.points,
            programId: row.program_id,
            programName: row.programs.name,
            programCategory: row.programs.category,
            studentId: student.id,
            studentName: student.name,
            studentMalayalamName: student.malayalam_name,
            rollNumber: student.roll_number,
            className: student.class,
            houseName: row.entry.main_groups?.name ?? null,
            photoUrl: student.photo_url,
          },
        ];
      }),
  );
}

export type PodiumCertificateRow = {
  id: string;
  position: number;
  points: number;
  programId: string;
  programName: string;
  programCategory: string;
  studentId: string;
  studentName: string;
  studentMalayalamName: string | null;
  rollNumber: string;
  className: string;
  houseName: string | null;
  photoUrl: string | null;
};

/**
 * Every podium (position 1–3) result across every program, with full admin-only detail
 * (roll number, class, house) — the dedicated /admin/certificates page's data source,
 * flattened rather than nested (unlike listResults) since that page groups the same rows
 * two ways: by student and by program (CertificatesBrowser). Admin-only session, so — same
 * reasoning as listResults — this can include every program status, not just published.
 */
export async function listPodiumResultsForCertificates(): Promise<PodiumCertificateRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("results")
    .select(
      "id, position, points, program_id, programs(name, category), students(id, name, malayalam_name, roll_number, class, photo_url, main_groups(name))",
    )
    .lte("position", 3)
    .order("position", { ascending: true });

  if (error) {
    console.error("listPodiumResultsForCertificates failed:", error.message);
    return [];
  }

  const individualRows = data.flatMap((row) => {
    const student = row.students;
    if (!student || !row.programs) {
      return [];
    }
    return [
      {
        id: row.id,
        position: row.position,
        points: row.points,
        programId: row.program_id,
        programName: row.programs.name,
        programCategory: row.programs.category,
        studentId: student.id,
        studentName: student.name,
        studentMalayalamName: student.malayalam_name,
        rollNumber: student.roll_number,
        className: student.class,
        houseName: student.main_groups?.name ?? null,
        photoUrl: student.photo_url,
      },
    ];
  });

  const teamRows = await expandTeamResultsForCertificates(supabase, 3);
  return [...individualRows, ...teamRows].sort((a, b) => a.position - b.position);
}

/**
 * One program's podium (positions 1-3), individual and group programs alike — the
 * PrintCertificatesDialog's data source (per-program, unlike listPodiumResultsForCertificates'
 * every-program list for /admin/certificates). A group program's team result gets
 * expanded into one row per member here too, same reasoning as
 * listPodiumResultsForCertificates: the dialog still prints one certificate per student.
 */
export async function listProgramPodiumForCertificates(
  programId: string,
): Promise<PodiumCertificateRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("results")
    .select(
      "id, position, points, program_id, programs(name, category), students(id, name, malayalam_name, roll_number, class, photo_url, main_groups(name))",
    )
    .eq("program_id", programId)
    .lte("position", 3)
    .order("position", { ascending: true });

  if (error) {
    console.error("listProgramPodiumForCertificates failed:", error.message);
    return [];
  }

  const individualRows = data.flatMap((row) => {
    const student = row.students;
    if (!student || !row.programs) {
      return [];
    }
    return [
      {
        id: row.id,
        position: row.position,
        points: row.points,
        programId: row.program_id,
        programName: row.programs.name,
        programCategory: row.programs.category,
        studentId: student.id,
        studentName: student.name,
        studentMalayalamName: student.malayalam_name,
        rollNumber: student.roll_number,
        className: student.class,
        houseName: student.main_groups?.name ?? null,
        photoUrl: student.photo_url,
      },
    ];
  });

  const teamRows = await expandTeamResultsForCertificates(supabase, 3, programId);
  return [...individualRows, ...teamRows].sort((a, b) => a.position - b.position);
}

export type PublishedProgramPodiumRow = {
  programId: string;
  programName: string;
  programMalayalamName: string | null;
  programCategory: string;
  podium: {
    position: number;
    points: number;
    studentName: string;
    studentMalayalamName: string | null;
    /** Individual programs only — a group win has no single student's class to show. */
    studentClass: string | null;
    groupName: string | null;
    groupMalayalamName: string | null;
    photoUrl: string | null;
  }[];
};

/**
 * Every published program, each with its podium (position 1–3) — the data source for
 * the /admin/results-poster page's "share this program's result to the WhatsApp
 * group" poster. Deliberately published-only (unlike listPodiumResultsForCertificates,
 * which intentionally includes every status so certificates can be printed ahead of
 * the public announcement): a poster is the public announcement itself, so it can't
 * exist for a program that hasn't been announced yet.
 *
 * Queries from `programs` rather than `results` (opposite of
 * listPodiumResultsForCertificates) so a published program with no podium yet still
 * shows up on the page with an empty podium, rather than being invisible until
 * someone else finishes scoring it — the page's whole point is "here's what's left
 * to post", not just "here's what's ready".
 */
export async function listPublishedProgramPodiums(): Promise<PublishedProgramPodiumRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("programs")
    .select(
      "id, name, malayalam_name, category, results(position, points, students(name, malayalam_name, class, photo_url, main_groups(name, malayalam_name, photo_url)), program_group_entries(main_groups(name, malayalam_name, photo_url)))",
    )
    .eq("status", "published")
    .lte("results.position", 3)
    .order("name", { ascending: true });

  if (error) {
    console.error("listPublishedProgramPodiums failed:", error.message);
    return [];
  }

  return data.map((program) => ({
    programId: program.id,
    programName: program.name,
    programMalayalamName: program.malayalam_name,
    programCategory: program.category,
    // D-025 follow-up: a group program's podium has no individual student — the poster
    // shows the winning house's own name/photo in the studentName/photoUrl slots
    // instead (a poster only ever needs to name who won, and for a team that's the
    // house), with groupName duplicating it for layouts that render both fields.
    podium: program.results
      .filter((result) => result.students || result.program_group_entries?.main_groups)
      .map((result) => {
        const group = result.students?.main_groups ?? result.program_group_entries?.main_groups;
        return {
          position: result.position,
          points: result.points,
          studentName: result.students?.name ?? group?.name ?? "",
          studentMalayalamName: result.students?.malayalam_name ?? group?.malayalam_name ?? null,
          studentClass: result.students?.class ?? null,
          groupName: group?.name ?? null,
          groupMalayalamName: group?.malayalam_name ?? null,
          photoUrl: result.students?.photo_url ?? group?.photo_url ?? null,
        };
      })
      .sort((a, b) => a.position - b.position),
  }));
}

/**
 * Every scored result across every program, position-uncapped — the data source for
 * the /admin/certificates "Participation" tab. Deliberately not filtered to
 * position > 3: a podium finisher can hold both a position certificate (this file's
 * listPodiumResultsForCertificates) and a participation certificate, confirmed with
 * the user rather than assumed. Same flattened admin-only shape as
 * listPodiumResultsForCertificates, just without the `.lte("position", 3)`.
 */
export async function listAllResultsForCertificates(): Promise<PodiumCertificateRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("results")
    .select(
      "id, position, points, program_id, programs(name, category), students(id, name, malayalam_name, roll_number, class, photo_url, main_groups(name))",
    )
    .order("position", { ascending: true });

  if (error) {
    console.error("listAllResultsForCertificates failed:", error.message);
    return [];
  }

  const individualRows = data.flatMap((row) => {
    const student = row.students;
    if (!student || !row.programs) {
      return [];
    }
    return [
      {
        id: row.id,
        position: row.position,
        points: row.points,
        programId: row.program_id,
        programName: row.programs.name,
        programCategory: row.programs.category,
        studentId: student.id,
        studentName: student.name,
        studentMalayalamName: student.malayalam_name,
        rollNumber: student.roll_number,
        className: student.class,
        houseName: student.main_groups?.name ?? null,
        photoUrl: student.photo_url,
      },
    ];
  });

  const teamRows = await expandTeamResultsForCertificates(supabase);
  return [...individualRows, ...teamRows].sort((a, b) => a.position - b.position);
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
    .select(
      "id, position, points, updated_at, programs(name, category), students(name, photo_url), program_group_entries(main_groups(name, photo_url))",
    )
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("listLatestPublishedResults failed:", error.message);
    return [];
  }

  // D-025 follow-up: a group program's row has no individual student (it's keyed by
  // group_entry_id) — falls back to the house's own name/photo rather than
  // disappearing from this feed, same house-only treatment every OTHER audience panel
  // already uses (D-017). Confirmed with the user: this is not a widening of D-020's
  // student-detail exception to team wins, only a fallback for the case it can't cover.
  return data.flatMap((row) => {
    if (!row.programs) {
      return [];
    }
    const identity = row.students ?? row.program_group_entries?.main_groups;
    if (!identity) {
      return [];
    }
    return [
      {
        id: row.id,
        position: row.position,
        points: row.points,
        programName: row.programs.name,
        programCategory: row.programs.category,
        studentName: identity.name,
        studentPhotoUrl: identity.photo_url,
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
 * category (in the app's CATEGORIES order, not alphabetical) then program
 * name in JS rather than at the DB level — PostgREST only honors `.order()` on a
 * joined table when that join is `!inner` (this one deliberately isn't, so a program
 * missing a group/photo is skipped via flatMap below rather than dropping the row).
 */
export async function listProgramWinners(): Promise<PublicResultRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("results")
    .select(
      "id, position, points, updated_at, programs(name, category), students(main_groups(name, photo_url)), program_group_entries(main_groups(name, photo_url))",
    )
    .eq("position", 1);

  if (error) {
    console.error("listProgramWinners failed:", error.message);
    return [];
  }

  // D-025 follow-up: this panel was already house-only, so a group program's row (no
  // student, keyed by group_entry_id) just needs its own house reached a different way.
  const winners = data.flatMap((row) => {
    const group = row.students?.main_groups ?? row.program_group_entries?.main_groups;
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
    .select(
      "id, position, points, updated_at, programs(name, category), students(name, photo_url), program_group_entries(main_groups(name, photo_url))",
    )
    .eq("program_id", latest.program_id)
    .lte("position", 3)
    .order("position", { ascending: true });

  if (error) {
    console.error("listLatestProgramPodium failed:", error.message);
    return [];
  }

  // D-025 follow-up: same house-name fallback as listLatestPublishedResults above, for
  // the same reason — a group program's row has no individual student.
  return data.flatMap((row) => {
    if (!row.programs) {
      return [];
    }
    const identity = row.students ?? row.program_group_entries?.main_groups;
    if (!identity) {
      return [];
    }
    return [
      {
        id: row.id,
        position: row.position,
        points: row.points,
        programName: row.programs.name,
        programCategory: row.programs.category,
        studentName: identity.name,
        studentPhotoUrl: identity.photo_url,
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
