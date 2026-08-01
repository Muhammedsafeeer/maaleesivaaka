import type { Metadata } from "next";
import { listPrograms } from "@/lib/services/program.service";
import { listGroupLeaderboard } from "@/lib/services/leaderboard.service";
import { listLatestPublishedResults, listProgramWinners } from "@/lib/services/result.service";
import { LeaderboardList } from "@/components/dashboard/LeaderboardList";
import { LatestResultsList } from "@/features/leaderboard/components/LatestResultsList";
import { LatestWinnerBanner } from "@/features/leaderboard/components/LatestWinnerBanner";
import { ProgramWinnersList } from "@/features/leaderboard/components/ProgramWinnersList";
import { FullscreenToggle } from "@/features/leaderboard/components/FullscreenToggle";
import { RealtimeLeaderboardListener } from "@/components/dashboard/RealtimeLeaderboardListener";
import { RealtimeProgramsListener } from "@/components/dashboard/RealtimeProgramsListener";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CATEGORIES, STAGE_TYPES } from "@/constants/programs";

export const metadata: Metadata = {
  title: "Live — Festival Dashboard",
};

const categoryLabels = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]));

/**
 * No login required (src/constants/roles.ts PUBLIC_ROUTES) — the only gate is RLS
 * itself. D-017: house names only, never an individual student's name or photo.
 */
export default async function AudiencePage() {
  const [currentPrograms, leaderboard, latestResults, programWinners] = await Promise.all([
    // Starting a program on the Fixture page goes straight to 'scoring' — that's the
    // only "on stage" status a program can have (the 'ongoing' status was removed).
    listPrograms({ status: "scoring" }),
    listGroupLeaderboard(),
    listLatestPublishedResults(),
    listProgramWinners(),
  ]);

  // On-stage and off-stage each run independently (fixture.service.ts's
  // startNextProgram/CURRENT_STATUSES check is scoped per stage_type), so up to one
  // program per stage can be 'scoring' at the same time — this shows both rather than
  // only the first program in the list.
  const currentByStage = new Map(
    STAGE_TYPES.map((s) => [
      s.value,
      currentPrograms.find((p) => p.stage_type === s.value) ?? null,
    ]),
  );
  // latestResults is already newest-first (listLatestPublishedResults), so this is the
  // most recently published 1st place — no separate query, just a derived pick.
  const latestWinner = latestResults.find((result) => result.position === 1) ?? null;

  return (
    <div className="mx-auto flex min-h-full max-w-4xl flex-col gap-6 p-4 sm:p-6">
      <RealtimeLeaderboardListener />
      <RealtimeProgramsListener />

      <div className="flex items-center justify-between gap-4">
        <h1 className="font-heading text-xl font-medium">Festival Live</h1>
        <FullscreenToggle />
      </div>

      {latestWinner ? <LatestWinnerBanner winner={latestWinner} /> : null}

      <Card>
        <CardHeader>
          <CardTitle>Now Performing</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {STAGE_TYPES.map((stage) => {
            const program = currentByStage.get(stage.value) ?? null;
            return (
              <div
                key={stage.value}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-border px-3 py-2"
              >
                <Badge className="shrink-0">{stage.label}</Badge>
                {program ? (
                  <>
                    <span className="text-lg font-semibold">{program.name}</span>
                    <Badge variant="outline">{categoryLabels[program.category]}</Badge>
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    Nothing on stage right now.
                  </span>
                )}
              </div>
            );
          })}
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

      <ProgramWinnersList winners={programWinners} />

      <LatestResultsList results={latestResults} />
    </div>
  );
}
