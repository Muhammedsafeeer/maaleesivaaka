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
import {
  TvSlideshow,
  TV_SLIDE_DURATION_MS,
  countTvSlides,
} from "@/features/tv/components/TvSlideshow";

export const metadata: Metadata = {
  title: "Live TV",
};

/** Always serve fresh data — each meta-refresh navigation must hit the server. */
export const dynamic = "force-dynamic";

/**
 * Unattended big-screen display. Slide rotation + data refresh use
 * `<meta http-equiv="refresh">` (no JavaScript) because the hall Panasonic browser
 * does not run our client bundles or `/tv-fit.js`. Each tick navigates to `/tv?s=N`,
 * which re-fetches standings and advances the slide.
 */
export default async function TvPage({
  searchParams,
}: {
  searchParams: Promise<{ s?: string }>;
}) {
  const params = await searchParams;

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

  const groupProgramsOnStage = nowPerforming.filter((p) => p.participation_type === "group");
  const entriesByProgram = await Promise.all(
    groupProgramsOnStage.map((program) => listGroupEntries(program.id)),
  );
  const housesByProgram: Record<string, GroupLeaderboardRow[]> = {};
  groupProgramsOnStage.forEach((program, i) => {
    const groupIds = new Set(entriesByProgram[i].map((entry) => entry.group_id));
    housesByProgram[program.id] = standings.filter((house) => groupIds.has(house.id));
  });

  const slideCount = countTvSlides({
    standings,
    latestWinner,
    nowPerforming,
    currentBreaks,
    latestResults,
    programWinners,
    festivalStatus,
    ads,
  });

  const raw = Number.parseInt(params.s ?? "0", 10);
  const activeIndex =
    slideCount === 0 ? 0 : ((Number.isFinite(raw) ? raw : 0) % slideCount + slideCount) % slideCount;
  const nextIndex = slideCount <= 1 ? 0 : (activeIndex + 1) % slideCount;
  const refreshSeconds = Math.max(1, Math.round(TV_SLIDE_DURATION_MS / 1000));
  // Relative URL — works on LAN IP and localhost without hardcoding the host.
  const refreshUrl = slideCount <= 1 ? "/tv" : `/tv?s=${nextIndex}`;

  return (
    <>
      {/* No-JS slideshow: Panasonic ignores our scripts; meta refresh still works. */}
      <meta httpEquiv="refresh" content={`${refreshSeconds};url=${refreshUrl}`} />
      <RealtimeLeaderboardListener />
      <RealtimeProgramsListener />
      <RealtimeAdsListener />
      <TvSlideshow
        activeIndex={activeIndex}
        slideCount={slideCount}
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
