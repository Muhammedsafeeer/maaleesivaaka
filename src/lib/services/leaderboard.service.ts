import { createClient, createAnonClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

type SupabaseClientLike = ReturnType<typeof createAnonClient>;
type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Every column of a Postgres view is nullable in the generated types (views carry no
 * NOT NULL constraints, unlike real tables) — even though in practice main_groups.id
 * and .name can never actually be null here, since main_groups is the non-nullable
 * left side of the view's join (D-002). Normalized away here so nothing downstream has
 * to think about it.
 */
type GroupLeaderboardViewRow = Database["public"]["Views"]["group_leaderboard"]["Row"];

export type GroupLeaderboardRow = {
  id: string;
  name: string;
  photo_url: string | null;
  total_points: number;
  rank: number;
};

export type GroupPublicResult = {
  id: string;
  programName: string;
  programCategory: string;
  position: number;
  points: number;
};

/**
 * One house's own published results — the public QR-scan page's "recent results" list
 * (src/app/g/[id]/page.tsx). House-only, no student names (D-017's same contract as
 * every other public surface): individual-program rows reached via the scored
 * student's house, group-program rows via the team entry's house, same two-source
 * split group_leaderboard/listGroupPointContributions already use. Uses
 * createAnonClient() — /g/[id] is a public route, so an anonymous caller only ever
 * sees rows is_program_published() already allows (published AND not hide_results);
 * the request's own session client would instead carry through admin/judge RLS access
 * for a staff member simply logged in on the same browser. See createAnonClient's own
 * comment.
 */
export async function listGroupPublicResults(groupId: string): Promise<GroupPublicResult[]> {
  const supabase = createAnonClient();

  const [{ data: individualRows }, { data: teamRows }] = await Promise.all([
    supabase
      .from("results")
      .select("id, position, points, updated_at, programs(name, category), students!inner(group_id)")
      .eq("students.group_id", groupId),
    supabase
      .from("results")
      .select(
        "id, position, points, updated_at, programs(name, category), program_group_entries!inner(group_id)",
      )
      .eq("program_group_entries.group_id", groupId),
  ]);

  const rows = [...(individualRows ?? []), ...(teamRows ?? [])].sort((a, b) =>
    a.updated_at < b.updated_at ? 1 : -1,
  );

  return rows.flatMap((row) => {
    if (!row.programs) return [];
    return [
      {
        id: row.id,
        programName: row.programs.name,
        programCategory: row.programs.category,
        position: row.position,
        points: row.points,
      },
    ];
  });
}

/** Shared by listGroupLeaderboard/listPublicGroupLeaderboard below — the view read
 * itself doesn't change, only which client (and therefore which RLS identity) runs
 * it. */
async function queryGroupLeaderboard(
  supabase: SupabaseServerClient | SupabaseClientLike,
  limit?: number,
): Promise<GroupLeaderboardRow[]> {
  let query = supabase.from("group_leaderboard").select("*").order("rank", { ascending: true });
  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error("listGroupLeaderboard failed:", error.message);
    return [];
  }

  return (data ?? [])
    .filter(
      (row): row is GroupLeaderboardViewRow & { id: string; name: string } =>
        row.id !== null && row.name !== null,
    )
    .map((row) => ({
      id: row.id,
      name: row.name,
      photo_url: row.photo_url,
      total_points: row.total_points ?? 0,
      rank: row.rank ?? 0,
    }));
}

/** Reads the group_leaderboard view (D-002) — never stored, always derived from
 * results.points on read, so this is correct-by-construction even right after a score
 * correction. Pass `limit` for a preview (e.g. the dashboard's top 5); omit it for the
 * full standings. Admin-only: this runs under the request's own session, so it
 * deliberately includes completed-but-not-yet-published results (RLS's admin policy
 * grants full `results` access) — an admin reviewing standings wants the true current
 * picture, not just what's already public. Never call this from /audience, /tv, or
 * /g/[id] — use listPublicGroupLeaderboard there instead.
 */
export async function listGroupLeaderboard(limit?: number): Promise<GroupLeaderboardRow[]> {
  const supabase = await createClient();
  return queryGroupLeaderboard(supabase, limit);
}

/**
 * Public sibling of listGroupLeaderboard, for /audience, /tv, and /g/[id] — the three
 * deliberately public routes (constants/roles.ts's PUBLIC_ROUTES). Uses
 * createAnonClient() rather than the request's own session, so a staff member simply
 * logged in as admin/judge on the same browser previewing one of these pages doesn't
 * silently see completed-but-not-yet-published results counted into the totals; see
 * createAnonClient's own comment.
 */
export async function listPublicGroupLeaderboard(limit?: number): Promise<GroupLeaderboardRow[]> {
  const supabase = createAnonClient();
  return queryGroupLeaderboard(supabase, limit);
}

export type GroupPointContribution = {
  id: string;
  /** The underlying `results.id` — shared by every member of the same team result
   * (unlike `id`, which is per-student so React has a unique list key). The UI groups
   * on this so a team's shared points show once, not once per member. */
  resultId: string;
  studentId: string;
  studentName: string;
  studentPhotoUrl: string | null;
  programId: string;
  programName: string;
  programCategory: string;
  position: number;
  points: number;
  /** True for a group-program result: `points` is the whole team's shared total
   * (D-025 follow-up), attributed here to every member, not this student's own score. */
  isTeamResult: boolean;
};

/**
 * Every result that contributes to one house's total_points (admin-only drill-down for
 * LeaderboardList — "which students actually earned this house's score"). Mirrors
 * group_leaderboard's own two-source union (D-025 follow-up): individual-program
 * results reached via the scored student's house, group-program results reached via
 * the team entry's house and expanded to every member so the drill-down lists real
 * students, not an anonymous team row.
 */
export async function listGroupPointContributions(groupId: string): Promise<GroupPointContribution[]> {
  const supabase = await createClient();

  const { data: individualRows, error: individualError } = await supabase
    .from("results")
    .select(
      "id, position, points, program_id, programs(name, category), students!inner(id, name, photo_url, group_id)",
    )
    .eq("students.group_id", groupId)
    .order("points", { ascending: false });

  if (individualError) {
    console.error("listGroupPointContributions (individual) failed:", individualError.message);
  }

  const individualContributions: GroupPointContribution[] = (individualRows ?? []).flatMap((row) => {
    if (!row.students || !row.programs) return [];
    return [
      {
        id: row.id,
        resultId: row.id,
        studentId: row.students.id,
        studentName: row.students.name,
        studentPhotoUrl: row.students.photo_url,
        programId: row.program_id,
        programName: row.programs.name,
        programCategory: row.programs.category,
        position: row.position,
        points: row.points,
        isTeamResult: false,
      },
    ];
  });

  const { data: teamResults, error: teamError } = await supabase
    .from("results")
    .select(
      "id, position, points, program_id, programs(name, category), program_group_entries!inner(group_id)",
    )
    .eq("program_group_entries.group_id", groupId);

  if (teamError) {
    console.error("listGroupPointContributions (team) failed:", teamError.message);
  }

  let teamContributions: GroupPointContribution[] = [];
  if (teamResults && teamResults.length > 0) {
    const programIds = [...new Set(teamResults.map((r) => r.program_id))];
    const { data: memberRows } = await supabase
      .from("program_students")
      .select("program_id, students(id, name, photo_url, group_id)")
      .in("program_id", programIds);

    teamContributions = teamResults.flatMap((result) => {
      if (!result.programs) return [];
      return (memberRows ?? [])
        .filter((m) => m.program_id === result.program_id && m.students?.group_id === groupId)
        .flatMap((m) => {
          const student = m.students;
          if (!student) return [];
          return [
            {
              id: `${result.id}-${student.id}`,
              resultId: result.id,
              studentId: student.id,
              studentName: student.name,
              studentPhotoUrl: student.photo_url,
              programId: result.program_id,
              programName: result.programs!.name,
              programCategory: result.programs!.category,
              position: result.position,
              points: result.points,
              isTeamResult: true,
            },
          ];
        });
    });
  }

  return [...individualContributions, ...teamContributions].sort((a, b) => b.points - a.points);
}
