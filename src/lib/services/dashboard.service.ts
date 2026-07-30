import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

/**
 * Every column of a Postgres view is nullable in the generated types (views carry no
 * NOT NULL constraints, unlike real tables) — even though in practice main_groups.id
 * and .name can never actually be null here, since main_groups is the non-nullable
 * left side of the view's join. getDashboardStats() below normalizes these away so
 * nothing downstream has to think about it.
 */
type GroupLeaderboardViewRow = Database["public"]["Views"]["group_leaderboard"]["Row"];

export type GroupLeaderboardRow = {
  id: string;
  name: string;
  photo_url: string | null;
  total_points: number;
  rank: number;
};

export type DashboardStats = {
  totalStudents: number;
  totalPrograms: number;
  totalGroups: number;
  totalJudges: number;
  /** "Completed" = programs.status in (completed, published) — a published program is
   * still finished, it just also happens to be released. Counting only the literal
   * 'completed' status would make a program stop counting as done the moment it's
   * published, which reads as a regression on the dashboard. Not specified by any doc;
   * this is the assistant's interpretation, easy to change. */
  completedPrograms: number;
  pendingPrograms: number;
  topGroups: GroupLeaderboardRow[];
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();

  const [
    { count: totalStudents },
    { count: totalPrograms },
    { count: totalGroups },
    { count: totalJudges },
    { count: completedPrograms },
    { count: pendingPrograms },
    { data: topGroups },
  ] = await Promise.all([
    supabase.from("students").select("*", { count: "exact", head: true }),
    supabase.from("programs").select("*", { count: "exact", head: true }),
    supabase.from("main_groups").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "judge"),
    supabase
      .from("programs")
      .select("*", { count: "exact", head: true })
      .in("status", ["completed", "published"]),
    supabase
      .from("programs")
      .select("*", { count: "exact", head: true })
      .in("status", ["draft", "upcoming", "ongoing", "scoring"]),
    supabase.from("group_leaderboard").select("*").order("rank", { ascending: true }).limit(5),
  ]);

  return {
    totalStudents: totalStudents ?? 0,
    totalPrograms: totalPrograms ?? 0,
    totalGroups: totalGroups ?? 0,
    totalJudges: totalJudges ?? 0,
    completedPrograms: completedPrograms ?? 0,
    pendingPrograms: pendingPrograms ?? 0,
    topGroups: (topGroups ?? [])
      .filter((row): row is GroupLeaderboardViewRow & { id: string; name: string } =>
        row.id !== null && row.name !== null,
      )
      .map((row) => ({
        id: row.id,
        name: row.name,
        photo_url: row.photo_url,
        total_points: row.total_points ?? 0,
        rank: row.rank ?? 0,
      })),
  };
}
