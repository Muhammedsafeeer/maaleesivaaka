import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

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

/** Reads the group_leaderboard view (D-002) — never stored, always derived from
 * results.points on read, so this is correct-by-construction even right after a score
 * correction. Pass `limit` for a preview (e.g. the dashboard's top 5); omit it for the
 * full standings. */
export async function listGroupLeaderboard(limit?: number): Promise<GroupLeaderboardRow[]> {
  const supabase = await createClient();

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

export type GroupPointContribution = {
  id: string;
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
