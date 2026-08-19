"use client";

import { useEffect, useState } from "react";
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
import type { Program } from "@/types/program";
import type { AdWithMedia } from "@/types/ad";

const SLIDE_DURATION_MS = 10_000;

type Slide =
  | { kind: "standings" }
  | { kind: "latestWinner" }
  | { kind: "nowPerforming" }
  | { kind: "latestResults" }
  | { kind: "programWinners" }
  | { kind: "festivalStatus" }
  | { kind: "ad"; ad: AdWithMedia };

/** A stable identity per slide entry — plain `kind` collides for ads, since more than
 * one can be pushed at once. */
function slideKey(slide: Slide): string {
  return slide.kind === "ad" ? `ad-${slide.ad.id}` : slide.kind;
}

function IntermissionSlide() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
      <CrescentStar className="lantern-glow size-16 text-(--stage-spotlight-gold)" />
      <p className="font-[family-name:var(--font-audience-display)] text-4xl font-bold text-(--stage-spotlight-ink)">
        Maalee Sivaaka
      </p>
      <p className="text-lg text-(--stage-spotlight-ink-dim)">
        Live results appear here as the festival gets underway.
      </p>
    </div>
  );
}

/**
 * Rotates through whichever slides currently have data — a slide with nothing to show
 * (no one "now performing", no standings yet, ...) just skips rather than showing
 * empty. Each ad pushed to TV (/admin/ads "Push to TV") gets its own slot in the same
 * rotation, one slide per ad, in `position` order. `index` is plain client state on a
 * setInterval timer, decoupled from the data refreshes the Realtime listeners on the
 * page trigger (D-016): a score coming in mid-rotation doesn't reset or jump the
 * slideshow, it just updates whichever slide's props change next time that slide is on
 * screen. TvHeader (branding + clock) and the progress bar render outside the
 * per-slide fade so they never flicker across rotations — only the slide content
 * itself cross-fades.
 */
export function TvSlideshow({
  standings,
  latestWinner,
  nowPerforming,
  housesByProgram,
  latestResults,
  programWinners,
  festivalStatus,
  ads,
}: {
  standings: GroupLeaderboardRow[];
  latestWinner: LatestWinnerStudentRow[];
  nowPerforming: Program[];
  housesByProgram: Record<string, GroupLeaderboardRow[]>;
  latestResults: LatestResultStudentRow[];
  programWinners: PublicResultRow[];
  festivalStatus: CategoryStatus[];
  ads: AdWithMedia[];
}) {
  const slides: Slide[] = [
    standings.length > 0 ? { kind: "standings" as const } : null,
    latestWinner.length > 0 ? { kind: "latestWinner" as const } : null,
    nowPerforming.length > 0 ? { kind: "nowPerforming" as const } : null,
    latestResults.length > 0 ? { kind: "latestResults" as const } : null,
    programWinners.length > 0 ? { kind: "programWinners" as const } : null,
    festivalStatus.some((s) => s.total > 0) ? { kind: "festivalStatus" as const } : null,
    ...ads.map((ad) => (ad.media.length > 0 ? { kind: "ad" as const, ad } : null)),
  ].filter((slide): slide is Slide => slide !== null);

  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = window.setInterval(() => {
      setIndex((i) => i + 1);
    }, SLIDE_DURATION_MS);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  if (slides.length === 0) {
    return (
      <TvStage>
        <TvHeader />
        <DomeSilhouette className="pointer-events-none absolute inset-x-0 bottom-0 h-32 w-full text-(--stage-spotlight-gold)/10" />
        <IntermissionSlide />
      </TvStage>
    );
  }

  const activeIndex = index % slides.length;
  const active = slides[activeIndex];

  return (
    <TvStage>
      {/* Soft ambient sparkle, matching OrnateFrame's "spotlight" surface treatment —
          keeps the background feeling alive during a long-running unattended display. */}
      <span aria-hidden="true" className="pointer-events-none absolute inset-0">
        <span className="lantern-glow absolute top-[10%] left-[8%] size-2 rounded-full bg-(--stage-spotlight-gold) opacity-30" />
        <span className="lantern-glow absolute top-[20%] left-[88%] size-1.5 rounded-full bg-(--stage-spotlight-gold) opacity-40 [animation-delay:0.8s]" />
        <span className="lantern-glow absolute top-[75%] left-[5%] size-1.5 rounded-full bg-(--stage-spotlight-gold) opacity-30 [animation-delay:1.6s]" />
        <span className="lantern-glow absolute top-[85%] left-[92%] size-2 rounded-full bg-(--stage-spotlight-gold) opacity-25 [animation-delay:2.2s]" />
      </span>

      <DomeSilhouette className="pointer-events-none absolute inset-x-0 bottom-0 h-32 w-full text-(--stage-spotlight-gold)/10" />

      <TvHeader />

      <div
        key={`${slideKey(active)}-${activeIndex}`}
        className="animate-in fade-in absolute inset-0 duration-1000"
      >
        {active.kind === "standings" ? <StandingsSlide groups={standings} /> : null}
        {active.kind === "latestWinner" ? <LatestWinnerSlide results={latestWinner} /> : null}
        {active.kind === "nowPerforming" ? (
          <NowPerformingSlide programs={nowPerforming} housesByProgram={housesByProgram} />
        ) : null}
        {active.kind === "latestResults" ? <LatestResultsSlide results={latestResults} /> : null}
        {active.kind === "programWinners" ? <ProgramWinnersSlide winners={programWinners} /> : null}
        {active.kind === "festivalStatus" ? <FestivalStatusSlide statuses={festivalStatus} /> : null}
        {active.kind === "ad" ? <AdTvSlide ad={active.ad} /> : null}
      </div>

      {slides.length > 1 ? (
        <div className="absolute inset-x-0 bottom-6 flex justify-center gap-2 px-16">
          {slides.map((slide, i) => (
            <div
              key={slideKey(slide)}
              className="h-1.5 max-w-24 flex-1 overflow-hidden rounded-full bg-(--stage-spotlight-gold)/20"
            >
              {i === activeIndex ? (
                <div
                  key={activeIndex}
                  className="tv-slide-progress h-full rounded-full bg-(--stage-spotlight-gold)"
                  style={{ animationDuration: `${SLIDE_DURATION_MS}ms` }}
                />
              ) : i < activeIndex ? (
                <div className="h-full w-full rounded-full bg-(--stage-spotlight-gold)/50" />
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </TvStage>
  );
}
