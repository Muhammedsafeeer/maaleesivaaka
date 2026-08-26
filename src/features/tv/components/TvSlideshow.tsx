import { CrescentStar, DomeSilhouette } from "@/features/leaderboard/components/MotifIcons";
import { TvStage } from "@/features/tv/components/TvStage";
import { TvHeader } from "@/features/tv/components/TvHeader";
import { StandingsSlide } from "@/features/tv/components/StandingsSlide";
import { LatestWinnerSlide } from "@/features/tv/components/LatestWinnerSlide";
import { NowPerformingSlide } from "@/features/tv/components/NowPerformingSlide";
import { ProgramWinnersSlide } from "@/features/tv/components/ProgramWinnersSlide";
import { LatestResultsSlide } from "@/features/tv/components/LatestResultsSlide";
import { FestivalStatusSlide } from "@/features/tv/components/FestivalStatusSlide";
import { AdTvSlide } from "@/features/tv/components/AdTvSlide";
import type { GroupLeaderboardRow } from "@/lib/services/leaderboard.service";
import type {
  LatestWinnerStudentRow,
  LatestResultStudentRow,
  PublicResultRow,
} from "@/lib/services/result.service";
import type { CategoryStatus } from "@/lib/services/program.service";
import type { Program, FixtureBreak } from "@/types/program";
import type { AdWithMedia } from "@/types/ad";

/** Seconds between meta-refresh navigations (page.tsx). */
export const TV_SLIDE_DURATION_MS = 5_000;

type Slide =
  | { kind: "standings" }
  | { kind: "latestWinner" }
  | { kind: "nowPerforming" }
  | { kind: "latestResults" }
  | { kind: "programWinners" }
  | { kind: "festivalStatus" }
  | { kind: "ad"; ad: AdWithMedia };

function buildSlides(input: {
  standings: GroupLeaderboardRow[];
  latestWinner: LatestWinnerStudentRow[];
  nowPerforming: Program[];
  currentBreaks: FixtureBreak[];
  latestResults: LatestResultStudentRow[];
  programWinners: PublicResultRow[];
  festivalStatus: CategoryStatus[];
  ads: AdWithMedia[];
}): Slide[] {
  return [
    input.standings.length > 0 ? { kind: "standings" as const } : null,
    input.latestWinner.length > 0 ? { kind: "latestWinner" as const } : null,
    input.nowPerforming.some((p) => p.stage_type === "on_stage") ||
    input.currentBreaks.some((b) => b.stage_type === "on_stage")
      ? { kind: "nowPerforming" as const }
      : null,
    input.latestResults.length > 0 ? { kind: "latestResults" as const } : null,
    input.programWinners.length > 0 ? { kind: "programWinners" as const } : null,
    input.festivalStatus.some((s) => s.total > 0) ? { kind: "festivalStatus" as const } : null,
    ...input.ads.map((ad) => (ad.media.length > 0 ? { kind: "ad" as const, ad } : null)),
  ].filter((slide): slide is Slide => slide !== null);
}

/** Shared with page.tsx so meta-refresh `?s=` matches the rendered slide list. */
export function countTvSlides(input: Parameters<typeof buildSlides>[0]): number {
  return buildSlides(input).length;
}

function IntermissionSlide() {
  return (
    <div className="tv-slide">
      <CrescentStar style={{ width: 64, height: 64, color: "#e8c44a", marginBottom: 16 }} />
      <p className="tv-slide-title">Maalee Sivaaka</p>
      <p className="tv-slide-sub">Live results appear here as the festival gets underway.</p>
    </div>
  );
}

function Dome() {
  return (
    <DomeSilhouette
      className="pointer-events-none"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        width: "100%",
        height: 48,
        maxHeight: 48,
        color: "rgba(232, 196, 74, 0.08)",
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}

/**
 * Renders the active slide only. Advancement is server-driven via
 * `<meta http-equiv="refresh" content="5;url=/tv?s=N">` on the page — no client JS.
 */
export function TvSlideshow({
  activeIndex,
  slideCount,
  standings,
  latestWinner,
  nowPerforming,
  currentBreaks,
  housesByProgram,
  latestResults,
  programWinners,
  festivalStatus,
  ads,
}: {
  activeIndex: number;
  slideCount: number;
  standings: GroupLeaderboardRow[];
  latestWinner: LatestWinnerStudentRow[];
  nowPerforming: Program[];
  currentBreaks: FixtureBreak[];
  housesByProgram: Record<string, GroupLeaderboardRow[]>;
  latestResults: LatestResultStudentRow[];
  programWinners: PublicResultRow[];
  festivalStatus: CategoryStatus[];
  ads: AdWithMedia[];
}) {
  const slides = buildSlides({
    standings,
    latestWinner,
    nowPerforming,
    currentBreaks,
    latestResults,
    programWinners,
    festivalStatus,
    ads,
  });

  if (slides.length === 0) {
    return (
      <TvStage>
        <TvHeader />
        <Dome />
        <IntermissionSlide />
      </TvStage>
    );
  }

  const index = ((activeIndex % slides.length) + slides.length) % slides.length;
  const active = slides[index];

  return (
    <TvStage>
      <Dome />
      <TvHeader />

      <div
        id="tv-slides"
        data-tv-slide-count={slideCount || slides.length}
        data-tv-slide-active={index}
        style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
      >
        {active.kind === "standings" ? <StandingsSlide groups={standings} /> : null}
        {active.kind === "latestWinner" ? <LatestWinnerSlide results={latestWinner} /> : null}
        {active.kind === "nowPerforming" ? (
          <NowPerformingSlide
            programs={nowPerforming}
            currentBreaks={currentBreaks}
            housesByProgram={housesByProgram}
          />
        ) : null}
        {active.kind === "latestResults" ? <LatestResultsSlide results={latestResults} /> : null}
        {active.kind === "programWinners" ? <ProgramWinnersSlide winners={programWinners} /> : null}
        {active.kind === "festivalStatus" ? <FestivalStatusSlide statuses={festivalStatus} /> : null}
        {active.kind === "ad" ? <AdTvSlide ad={active.ad} /> : null}
      </div>

      {slides.length > 1 ? (
        <div className="tv-progress-row">
          {slides.map((slide, i) => (
            <div key={`${slide.kind}-${i}`} className="tv-progress-seg">
              <div className="tv-progress-fill" style={{ width: i <= index ? "100%" : "0%" }} />
            </div>
          ))}
        </div>
      ) : null}
    </TvStage>
  );
}
