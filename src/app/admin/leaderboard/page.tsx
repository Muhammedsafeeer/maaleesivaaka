import type { Metadata } from "next";
import { listGroupLeaderboard } from "@/lib/services/leaderboard.service";
import { LeaderboardList } from "@/components/dashboard/LeaderboardList";

export const metadata: Metadata = {
  title: "Leaderboard",
};

/** No RealtimeLeaderboardListener here — AdminLayout mounts one for the whole admin
 * section now (needed to keep the header's tie-notification bell live everywhere), and
 * the Supabase realtime client keys channels by name: two hook instances both calling
 * .channel("results-changes") on the same page throws ("cannot add postgres_changes
 * callbacks... after subscribe()") rather than silently double-subscribing. */
export default async function LeaderboardPage() {
  const rows = await listGroupLeaderboard();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-xl font-medium">Leaderboard</h1>
        <p className="text-sm text-muted-foreground">
          Every main group, ranked by total points (D-002: derived live from published
          and unpublished results — never stored, always current).
        </p>
      </div>

      <LeaderboardList rows={rows} />
    </div>
  );
}
