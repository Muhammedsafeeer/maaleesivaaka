import { Trophy } from "lucide-react";
import { PhotoThumbnail } from "@/components/tables/PhotoThumbnail";
import { CATEGORIES } from "@/constants/programs";
import type { LatestWinnerStudentRow } from "@/lib/services/result.service";

const categoryLabels = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]));

const POSITION_LABELS: Record<number, string> = { 1: "1st", 2: "2nd", 3: "3rd" };

const RANK_MEDAL: Record<number, string> = {
  1: "var(--podium-gold)",
  2: "var(--podium-silver)",
  3: "var(--podium-bronze)",
};

/**
 * The most recently published program's top 3 — a focused "who just won" podium.
 * Card anatomy (student reference design): a full-height photo on the left, a rank +
 * category tag and bold name on the right, and a gold footer strip carrying the
 * program name — distinct from LatestResultsList (a recency feed mixing positions and
 * programs) and AudienceLeaderboard (overall standings, not one program). Horizontal
 * scroll-snap row, same idiom as LatestResultsList, not a fixed grid — these cards need
 * more width than a 3-up grid gives them on a phone.
 *
 * Always shows *something* (an empty state, not nothing) when there's no result yet —
 * a panel that silently vanishes when empty is indistinguishable from a bug; every
 * other audience card (leaderboard, results, winners) already follows this rule.
 *
 * D-018 (docs/decisions.md): a deliberate, narrow exception to the rest of this app's
 * house-only public contract — this is the one place a student's own name and photo
 * appear, explicitly requested and confirmed by the user. Every other audience-facing
 * card stays house/group-only.
 */
export function LatestWinnerPodium({ results }: { results: LatestWinnerStudentRow[] }) {
  if (results.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-(--stage-ink)/60">
        The latest winner appears here as soon as a result is published.
      </p>
    );
  }

  return (
    <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2">
      {results.map((result) => (
        <div
          key={result.id}
          className="flex w-56 shrink-0 snap-start overflow-hidden rounded-2xl bg-(--stage-ivory) shadow-md"
        >
          <PhotoThumbnail
            url={result.studentPhotoUrl}
            alt={`${result.studentName} photo`}
            className="h-auto w-20 shrink-0 rounded-none"
          />
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex flex-1 flex-col gap-1.5 p-2.5">
              <span
                className="w-fit truncate rounded-full px-2 py-0.5 text-[0.6rem] font-bold tracking-wide text-(--stage-ink) uppercase"
                style={{ background: RANK_MEDAL[result.position] }}
              >
                {POSITION_LABELS[result.position] ?? `#${result.position}`} ·{" "}
                {categoryLabels[result.programCategory] ?? result.programCategory}
              </span>
              <p className="truncate text-sm font-bold text-(--stage-ink)">
                {result.studentName}
              </p>
            </div>
            <div className="flex items-center gap-1.5 bg-(--stage-gold)/15 px-2.5 py-2">
              <Trophy className="size-3 shrink-0 text-(--stage-gold-dim)" aria-hidden="true" />
              <span className="truncate text-[0.65rem] font-medium text-(--stage-gold-dim)">
                {result.programName}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
