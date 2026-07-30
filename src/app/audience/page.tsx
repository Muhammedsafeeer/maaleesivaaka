import type { Metadata } from "next";
import { listPrograms } from "@/lib/services/program.service";
import { listGroupLeaderboard } from "@/lib/services/leaderboard.service";
import { listLatestPublishedResults } from "@/lib/services/result.service";
import { LeaderboardList } from "@/components/dashboard/LeaderboardList";
import { LatestResultsList } from "@/features/leaderboard/components/LatestResultsList";
import { FullscreenToggle } from "@/features/leaderboard/components/FullscreenToggle";
import { RealtimeLeaderboardListener } from "@/components/dashboard/RealtimeLeaderboardListener";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CATEGORIES, STAGE_TYPES } from "@/constants/programs";

export const metadata: Metadata = {
  title: "Live — Festival Dashboard",
};

const categoryLabels = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]));
const stageTypeLabels = Object.fromEntries(STAGE_TYPES.map((s) => [s.value, s.label]));

/**
 * No login required (src/constants/roles.ts PUBLIC_ROUTES) — the only gate is RLS
 * itself. D-017: house names only, never an individual student's name or photo.
 */
export default async function AudiencePage() {
  const [ongoingPrograms, leaderboard, latestResults] = await Promise.all([
    listPrograms({ status: "ongoing" }),
    listGroupLeaderboard(),
    listLatestPublishedResults(),
  ]);

  const currentProgram = ongoingPrograms[0] ?? null;

  return (
    <div className="mx-auto flex min-h-full max-w-4xl flex-col gap-6 p-4 sm:p-6">
      <RealtimeLeaderboardListener />

      <div className="flex items-center justify-between gap-4">
        <h1 className="font-heading text-xl font-medium">Festival Live</h1>
        <FullscreenToggle />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Now Performing</CardTitle>
        </CardHeader>
        <CardContent>
          {currentProgram ? (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-lg font-semibold">{currentProgram.name}</span>
              <Badge variant="outline">{categoryLabels[currentProgram.category]}</Badge>
              <Badge variant="outline">{stageTypeLabels[currentProgram.stage_type]}</Badge>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No program is on stage right now.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Live Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <LeaderboardList rows={leaderboard} />
        </CardContent>
      </Card>

      <LatestResultsList results={latestResults} />
    </div>
  );
}
