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
