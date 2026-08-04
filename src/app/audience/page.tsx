import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Trophy, Award, Mic2, Activity, ListOrdered, Medal, Clock, Sparkles } from "lucide-react";
import { listPrograms, listCategoryStatus } from "@/lib/services/program.service";
import { listGroupLeaderboard } from "@/lib/services/leaderboard.service";
import {
  listLatestPublishedResults,
  listLatestProgramPodium,
  listProgramWinners,
} from "@/lib/services/result.service";
import { getCertificateSettings } from "@/lib/services/certificateSettings.service";
import { AudienceLeaderboard } from "@/features/leaderboard/components/AudienceLeaderboard";
import { FullStandingsList } from "@/features/leaderboard/components/FullStandingsList";
import { OrnateFrame } from "@/features/leaderboard/components/OrnateFrame";
import { SectionHeading } from "@/features/leaderboard/components/SectionHeading";
import { Lantern, DomeSilhouette } from "@/features/leaderboard/components/MotifIcons";
import { LatestResultsList } from "@/features/leaderboard/components/LatestResultsList";
import { LatestWinnerPodium } from "@/features/leaderboard/components/LatestWinnerPodium";
import { ProgramWinnersList } from "@/features/leaderboard/components/ProgramWinnersList";
import { FestivalStatus } from "@/features/leaderboard/components/FestivalStatus";
import { CategoryHighlights } from "@/features/leaderboard/components/CategoryHighlights";
import { StudentSearchBar } from "@/features/leaderboard/components/StudentSearchBar";
import { RealtimeLeaderboardListener } from "@/components/dashboard/RealtimeLeaderboardListener";
import { RealtimeProgramsListener } from "@/components/dashboard/RealtimeProgramsListener";
import { RealtimePublishAnnouncer } from "@/components/dashboard/RealtimePublishAnnouncer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CATEGORIES, STAGE_TYPES } from "@/constants/programs";
import { LOGIN_ROUTE } from "@/constants/roles";

export const metadata: Metadata = {
  title: "Maalee Sivaa Ka — Live",
};

const categoryLabels = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]));

/**
 * No login required (src/constants/roles.ts PUBLIC_ROUTES) — the only gate is RLS
 * itself. D-017: house names only, never an individual student's name or photo — except
 * the "Latest Winner" podium, a deliberate, narrow, user-confirmed exception (D-018).
 *
 * Ground-up rebuild (Phase 17, second pass) matching the Kerala Kalolsavam reference
 * screenshot section-for-section, not just its colour palette: a dark utility bar, a
 * dark hero podium, a light "participants" card row, light stat tiles, a dense
 * multi-column data section, and colour-blocked category cards. Two things in the
 * reference are deliberately NOT replicated: the mega nav (Venues/Downloads/Contacts/
 * Kalolsavam Category — no corresponding pages exist here) and a public participant
 * list — the "Find My Result" search (D-019) is lookup-only, entirely inside the top
 * bar's search + a modal (StudentSearchBar), not a page section.
 */
export default async function AudiencePage() {
  const [
    currentPrograms,
    leaderboard,
    latestResults,
    latestProgramPodium,
    programWinners,
    categoryStatus,
    certificateSettings,
  ] = await Promise.all([
    // Starting a program on the Fixture page goes straight to 'scoring' — that's the
    // only "on stage" status a program can have (the 'ongoing' status was removed).
    listPrograms({ status: "scoring" }),
    listGroupLeaderboard(),
    listLatestPublishedResults(),
    listLatestProgramPodium(),
    listProgramWinners(),
    listCategoryStatus(),
    getCertificateSettings(),
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

  return (
    <div className="relative mx-auto flex min-h-full max-w-4xl flex-col gap-6 overflow-hidden p-4 sm:p-6">
      <RealtimeLeaderboardListener />
      <RealtimeProgramsListener />
      <RealtimePublishAnnouncer />

      <div className="overflow-hidden rounded-2xl border-2 border-(--stage-gold)">
        <Image
          src="/audience/malee-banner.png"
          alt="Maalee Sivaaka — Muhyudheen Jumamasjid, Chayyoth — Rabi-ul-Awwal 12, 13, 14"
          width={1942}
          height={809}
          priority
          sizes="(max-width: 896px) 100vw, 896px"
          className="h-auto w-full"
        />
      </div>

      <DomeSilhouette
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-32 w-full text-(--stage-gold)/10 sm:h-40"
      />

      {/* Slim dark utility bar — the reference's top nav strip, scoped down to the
          things this app actually has (a live indicator, the D-019 student search, and
          Login) rather than replicating menu items with no corresponding page here.
          The banner above already carries the event's own branding, so there's no
          separate text wordmark duplicating it. */}
      <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-(--stage-spotlight-deep) to-(--stage-spotlight) px-4 py-2.5 shadow-md">
        <span className="hidden shrink-0 items-center gap-1.5 rounded-full bg-(--stage-spotlight-gold)/15 px-2.5 py-1 text-[0.65rem] font-semibold tracking-wide text-(--stage-spotlight-gold) uppercase sm:flex">
          <span
            className="lantern-glow size-1.5 shrink-0 rounded-full bg-(--stage-spotlight-gold)"
            aria-hidden="true"
          />
          Live
        </span>
        <StudentSearchBar certificateSettings={certificateSettings} />
        <Button
          asChild
          size="sm"
          className="shrink-0 rounded-full bg-(--stage-spotlight-gold) text-(--stage-spotlight-deep) hover:bg-(--stage-spotlight-gold)/90"
        >
          <Link href={LOGIN_ROUTE}>Login</Link>
        </Button>
      </div>

      {/* Hero: dark podium, top 3 only — mirrors the reference's "Leading Districts"
          panel. The rest of the standings live in the light table further down
          (#full-standings), same split as the reference's hero vs. its later table. */}
      <OrnateFrame surface="spotlight">
        <SectionHeading
          icon={<Trophy />}
          kicker="Overall Standings"
          title="Leading Houses"
          tint="spotlight"
          align="center"
        />
        <AudienceLeaderboard rows={leaderboard} />
      </OrnateFrame>

      <OrnateFrame tint="gold">
        <SectionHeading
          icon={<Award />}
          kicker="Just Declared"
          title="Latest Winner"
          tint="gold"
          align="center"
        />
        <LatestWinnerPodium results={latestProgramPodium} />
      </OrnateFrame>

      <OrnateFrame tint="emerald">
        <SectionHeading icon={<Mic2 />} kicker="On Stage" title="Now Performing" tint="emerald" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {STAGE_TYPES.map((stage) => {
            const program = currentByStage.get(stage.value) ?? null;
            return (
              <div
                key={stage.value}
                className={cn(
                  "relative rounded-2xl border p-4",
                  program
                    ? "border-(--stage-gold) bg-(--stage-spotlight) shadow-md"
                    : "border-(--stage-gold-dim)/30 bg-(--stage-cream-deep)/60",
                )}
              >
                {program ? (
                  <Lantern className="lantern-glow absolute top-3 right-3 size-4 text-(--stage-spotlight-gold)" />
                ) : null}
                <Badge
                  className={cn(
                    "mb-2 w-fit border-none",
                    program
                      ? "bg-(--stage-spotlight-gold)/20 text-(--stage-spotlight-gold)"
                      : "bg-(--stage-gold-dim)/25 text-(--stage-gold-bright)",
                  )}
                >
                  {stage.label}
                </Badge>
                {program ? (
                  <>
                    <p className="font-[family-name:var(--font-audience-display)] text-xl font-bold text-(--stage-spotlight-ink)">
                      {program.name}
                    </p>
                    <p className="mt-1 text-sm text-(--stage-spotlight-ink-dim)">
                      {categoryLabels[program.category]}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-(--stage-ink)/40">
                    Nothing on stage right now.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </OrnateFrame>

      <OrnateFrame tint="amber">
        <SectionHeading icon={<Activity />} kicker="Live Progress" title="Status of Festival" tint="amber" />
        <FestivalStatus statuses={categoryStatus} />
      </OrnateFrame>

      {/* Dense three-column data section — the reference's "Leading Districts /
          Leading Schools / Latest Results" table row. No "schools" concept exists in
          this app's data model, so the middle column is Program Winners (a genuinely
          distinct real dataset) rather than a fabricated stand-in. */}
      <div id="full-standings" className="grid scroll-mt-4 grid-cols-1 gap-4 sm:grid-cols-3">
        <OrnateFrame tint="sapphire" className="p-4 sm:p-5">
          <SectionHeading
            icon={<ListOrdered />}
            kicker="Full Table"
            title="Leading Houses"
            tint="sapphire"
            size="sm"
          />
          <FullStandingsList rows={leaderboard} />
        </OrnateFrame>

        <OrnateFrame tint="ruby" className="p-4 sm:p-5">
          <SectionHeading
            icon={<Medal />}
            kicker="1st Place"
            title="Program Winners"
            tint="ruby"
            size="sm"
          />
          <ProgramWinnersList winners={programWinners} />
        </OrnateFrame>

        <OrnateFrame tint="emerald" className="p-4 sm:p-5">
          <SectionHeading
            icon={<Clock />}
            kicker="Just In"
            title="Latest Results"
            tint="emerald"
            size="sm"
          />
          <LatestResultsList results={latestResults} />
        </OrnateFrame>
      </div>

      {/* Colour-blocked category cards — echoes the reference's "Detailed Results"
          block. Its cards are navigation hubs into category sub-pages this app doesn't
          have, so these show the real per-category numbers instead. */}
      <div>
        <SectionHeading
          icon={<Sparkles />}
          kicker="Browse By"
          title="Category Highlights"
          tint="gold"
          align="center"
        />
        <CategoryHighlights statuses={categoryStatus} />
      </div>

      <footer className="border-t border-(--stage-gold-dim)/40 pt-4 text-center text-xs text-(--stage-ink)/40">
        Live results, updating automatically.
      </footer>
    </div>
  );
}
