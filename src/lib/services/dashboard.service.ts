import { createClient } from "@/lib/supabase/server";
import { listGroupLeaderboard, type GroupLeaderboardRow } from "@/lib/services/leaderboard.service";
import { listRecentStudents } from "@/lib/services/student.service";
import type { StudentWithGroup } from "@/types/student";

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
  recentStudents: StudentWithGroup[];
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
    topGroups,
    recentStudents,
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
      .in("status", ["draft", "upcoming", "scoring"]),
    listGroupLeaderboard(5),
    listRecentStudents(5),
  ]);

  return {
    totalStudents: totalStudents ?? 0,
    totalPrograms: totalPrograms ?? 0,
    totalGroups: totalGroups ?? 0,
    totalJudges: totalJudges ?? 0,
    completedPrograms: completedPrograms ?? 0,
    pendingPrograms: pendingPrograms ?? 0,
    topGroups,
    recentStudents,
  };
}
