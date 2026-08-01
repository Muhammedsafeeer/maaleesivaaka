import type { Metadata } from "next";
import Link from "next/link";
import { listPrograms, listCategoryStatus } from "@/lib/services/program.service";
import { listGroupLeaderboard } from "@/lib/services/leaderboard.service";
import { listLatestPublishedResults, listProgramWinners } from "@/lib/services/result.service";
import { AudienceLeaderboard } from "@/features/leaderboard/components/AudienceLeaderboard";
import { OrnateFrame } from "@/features/leaderboard/components/OrnateFrame";
import { CrescentStar, Lantern, DomeSilhouette } from "@/features/leaderboard/components/MotifIcons";
import { LatestResultsList } from "@/features/leaderboard/components/LatestResultsList";
import { LatestWinnerBanner } from "@/features/leaderboard/components/LatestWinnerBanner";
import { ProgramWinnersList } from "@/features/leaderboard/components/ProgramWinnersList";
import { FestivalStatus } from "@/features/leaderboard/components/FestivalStatus";
import { FullscreenToggle } from "@/features/leaderboard/components/FullscreenToggle";
import { RealtimeLeaderboardListener } from "@/components/dashboard/RealtimeLeaderboardListener";
import { RealtimeProgramsListener } from "@/components/dashboard/RealtimeProgramsListener";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CATEGORIES, STAGE_TYPES } from "@/constants/programs";
import { LOGIN_ROUTE } from "@/constants/roles";

export const metadata: Metadata = {
  title: "Live — Festival Dashboard",
};

const categoryLabels = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]));

/**
 * No login required (src/constants/roles.ts PUBLIC_ROUTES) — the only gate is RLS
 * itself. D-017: house names only, never an individual student's name or photo.
 */
export default async function AudiencePage() {
  const [currentPrograms, leaderboard, latestResults, programWinners, categoryStatus] =
    await Promise.all([
      // Starting a program on the Fixture page goes straight to 'scoring' — that's the
      // only "on stage" status a program can have (the 'ongoing' status was removed).
      listPrograms({ status: "scoring" }),
      listGroupLeaderboard(),
      listLatestPublishedResults(),
      listProgramWinners(),
      listCategoryStatus(),
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
    <>
      {/*
        THESIS: The audience page reads like the moment the curtain opens — a lit lamp
        at the centre of a dark hall, not a generic KPI dashboard.
        OWN-WORLD: Deep green stage ground, gold ornament/type, ivory data plaques;
        crescent-and-star, fanous lantern, mosque-dome motifs (original SVGs, not traced
        from any reference image). Playfair Display for ceremonial headings, DM Sans for
        dense tabular data.
        STORY: A visitor reads, at a glance, what's live now, which house leads, and the
        latest declared result — updating on its own via Realtime, no refresh.
        FIRST VIEWPORT: Header (event name + Login) on the stage ground, then Now
        Performing framed in gold with a pulsing lantern for the live alcove, then
        Leading Houses as ranked ivory plaques.
        FORM: Real event branding (Milad-un-Nabi, Muhyudheen Jumamasjid) confirmed by the
        user as a direct match, not a rolled/abstract direction — see PRODUCT.md Brand
        Commitments, corrected 2026-08-01.
        FINISH: unreviewed and undocumented is unfinished; this build ends with the
        finish review, the verdict, and DESIGN.md
      */}
      <div className="relative mx-auto flex min-h-full max-w-4xl flex-col gap-5 overflow-hidden p-4 sm:p-6">
        <RealtimeLeaderboardListener />
        <RealtimeProgramsListener />

        <DomeSilhouette
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-32 w-full text-(--stage-green-800)/50 sm:h-40"
        />

        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-(--stage-gold-dim)/40 pb-4">
          <div className="flex items-center gap-2.5">
            <CrescentStar className="size-7 shrink-0 text-(--stage-gold)" />
            <div>
              <h1 className="font-[family-name:var(--font-audience-display)] text-xl font-bold text-(--stage-gold-bright) sm:text-2xl">
                Milad-un-Nabi — Live
              </h1>
              <p className="text-xs text-(--stage-ivory)/60">Muhyudheen Jumamasjid, Chayyoth</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FullscreenToggle />
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-(--stage-gold) bg-transparent text-(--stage-gold-bright) hover:bg-(--stage-gold)/10 hover:text-(--stage-gold-bright)"
            >
              <Link href={LOGIN_ROUTE}>Login</Link>
            </Button>
          </div>
        </header>

        {latestWinner ? <LatestWinnerBanner winner={latestWinner} /> : null}

        <OrnateFrame>
          <div className="mb-3 flex items-center gap-2">
            <Lantern className="size-5 shrink-0 text-(--stage-gold)" />
            <h2 className="font-[family-name:var(--font-audience-display)] text-lg font-bold text-(--stage-gold-bright)">
              Now Performing
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {STAGE_TYPES.map((stage) => {
              const program = currentByStage.get(stage.value) ?? null;
              return (
                <div
                  key={stage.value}
                  className={cn(
                    "relative rounded-xl border p-4",
                    program
                      ? "border-(--stage-gold) bg-(--stage-green-800)"
                      : "border-(--stage-gold-dim)/30 bg-(--stage-green-900)/60",
                  )}
                >
                  {program ? (
                    <Lantern className="lantern-glow absolute top-3 right-3 size-4 text-(--stage-gold)" />
                  ) : null}
                  <Badge className="mb-2 w-fit border-none bg-(--stage-gold-dim)/25 text-(--stage-gold-bright)">
                    {stage.label}
                  </Badge>
                  {program ? (
                    <>
                      <p className="font-[family-name:var(--font-audience-display)] text-xl font-bold text-(--stage-ivory)">
                        {program.name}
                      </p>
                      <p className="mt-1 text-sm text-(--stage-ivory)/70">
                        {categoryLabels[program.category]}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-(--stage-ivory)/50">
                      Nothing on stage right now.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </OrnateFrame>

        <OrnateFrame>
          <h2 className="mb-3 font-[family-name:var(--font-audience-display)] text-lg font-bold text-(--stage-gold-bright)">
            Leading Houses
          </h2>
          <AudienceLeaderboard rows={leaderboard} />
        </OrnateFrame>

        <OrnateFrame>
          <h2 className="mb-3 font-[family-name:var(--font-audience-display)] text-lg font-bold text-(--stage-gold-bright)">
            Latest Results
          </h2>
          <LatestResultsList results={latestResults} />
        </OrnateFrame>

        <OrnateFrame>
          <h2 className="mb-3 font-[family-name:var(--font-audience-display)] text-lg font-bold text-(--stage-gold-bright)">
            Status of Festival
          </h2>
          <FestivalStatus statuses={categoryStatus} />
        </OrnateFrame>

        <OrnateFrame>
          <h2 className="mb-3 font-[family-name:var(--font-audience-display)] text-lg font-bold text-(--stage-gold-bright)">
            Program Winners
          </h2>
          <ProgramWinnersList winners={programWinners} />
        </OrnateFrame>
      </div>
    </>
  );
}
