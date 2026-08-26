import type { Metadata } from "next";
import { listPublicGroupLeaderboard, type GroupLeaderboardRow } from "@/lib/services/leaderboard.service";
import {
  listLatestProgramPodium,
  listLatestPublishedResults,
  listProgramWinners,
} from "@/lib/services/result.service";
import { listPrograms, listCategoryStatus } from "@/lib/services/program.service";
import { listCurrentFixtureBreaks } from "@/lib/services/fixture.service";
import { listGroupEntries } from "@/lib/services/groupEntry.service";
import { listTvAds } from "@/lib/services/ad.service";
import { RealtimeLeaderboardListener } from "@/components/dashboard/RealtimeLeaderboardListener";
import { RealtimeProgramsListener } from "@/components/dashboard/RealtimeProgramsListener";
import { RealtimeAdsListener } from "@/components/dashboard/RealtimeAdsListener";
import { TvSlideshow } from "@/features/tv/components/TvSlideshow";

export const metadata: Metadata = {
  title: "Live TV",
};

/**
 * Unattended big-screen display for the school hall/lobby — public, no login, same
 * anon-RLS contract as /audience (D-017: house-only except the already-consented D-018
 * "Latest Winner" / D-020 "Latest Results" exceptions, reused here unchanged).
 * Deliberately not the interactive /audience page reformatted: no search box, no login
 * link, nothing scrollable — a slideshow that rotates on its own, meant to be glanced
 * at from across a room. Freshness comes from three Realtime listeners (results +
 * programs + ads tables -> router.refresh(), D-016) rather than polling — an
 * unattended display never navigates on its own, so without these an admin's "Push to
 * TV" toggle would need someone to manually refresh the TV's browser to show up.
 */
export default async function TvPage() {
  const [
    standings,
    latestWinner,
    nowPerforming,
    currentBreaks,
    latestResults,
    programWinners,
    festivalStatus,
    ads,
  ] = await Promise.all([
    listPublicGroupLeaderboard(),
    listLatestProgramPodium(),
    listPrograms({ status: "scoring" }),
    listCurrentFixtureBreaks(),
    listLatestPublishedResults(),
    listProgramWinners(),
    listCategoryStatus(),
    listTvAds(),
  ]);

  // For a group program currently on stage, its competing houses are already public
  // (their team entries exist before scoring starts) — cross-referenced against
  // `standings` (already fetched, carries name/photo/points per house) rather than a
  // second query per house.
  const groupProgramsOnStage = nowPerforming.filter((p) => p.participation_type === "group");
  const entriesByProgram = await Promise.all(
    groupProgramsOnStage.map((program) => listGroupEntries(program.id)),
  );
  const housesByProgram: Record<string, GroupLeaderboardRow[]> = {};
  groupProgramsOnStage.forEach((program, i) => {
    const groupIds = new Set(entriesByProgram[i].map((entry) => entry.group_id));
    housesByProgram[program.id] = standings.filter((house) => groupIds.has(house.id));
  });

  return (
    <>
    
      <RealtimeLeaderboardListener />
      <RealtimeProgramsListener />
      <RealtimeAdsListener />
      <TvSlideshow
        standings={standings}
        latestWinner={latestWinner}
        nowPerforming={nowPerforming}
        currentBreaks={currentBreaks}
        housesByProgram={housesByProgram}
        latestResults={latestResults}
        programWinners={programWinners}
        festivalStatus={festivalStatus}
        ads={ads}
      />
    </>
  );
}
