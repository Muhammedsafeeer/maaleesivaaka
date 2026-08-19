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
 * "Last winner" slide — the most recently published program's top 3, with the
 * student's own name and photo. Reuses listLatestProgramPodium() unchanged: this is
 * the same D-018-consented exception the interactive /audience page already shows,
 * just presented full-screen here.
 */
export function LatestWinnerSlide({ results }: { results: LatestWinnerStudentRow[] }) {
  if (results.length === 0) return null;
  const programName = results[0].programName;

  return (
    <div className="flex h-full flex-col items-center justify-center gap-10 px-16 py-12">
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-2xl font-bold tracking-[0.3em] text-(--stage-spotlight-gold) uppercase">
          Just Declared
        </p>
        <p className="font-[family-name:var(--font-audience-display)] text-3xl font-bold text-(--stage-spotlight-ink)">
          {programName}
        </p>
      </div>

      <div className="flex gap-8">
        {results.map((result, i) => (
          <div
            key={result.id}
            className="animate-in fade-in zoom-in-95 flex w-72 flex-col overflow-hidden rounded-3xl bg-(--stage-spotlight-card) shadow-2xl fill-mode-both"
            style={{ animationDelay: `${i * 200}ms`, animationDuration: "700ms" }}
          >
            <PhotoThumbnail
              url={result.studentPhotoUrl}
              alt={`${result.studentName} photo`}
              className="h-64 w-full rounded-none"
            />
            <div className="flex flex-1 flex-col gap-2 p-5">
              <span
                className="w-fit rounded-full px-3 py-1 text-xs font-bold tracking-wide text-(--stage-ink) uppercase"
                style={{ background: RANK_MEDAL[result.position] }}
              >
                {POSITION_LABELS[result.position] ?? `#${result.position}`} ·{" "}
                {categoryLabels[result.programCategory] ?? result.programCategory}
              </span>
              <p className="font-[family-name:var(--font-audience-display)] text-2xl font-bold text-(--stage-spotlight-ink)">
                {result.studentName}
              </p>
            </div>
            <div className="flex items-center gap-2 bg-(--stage-spotlight-gold)/15 px-5 py-3">
              <Trophy className="size-4 shrink-0 text-(--stage-spotlight-gold)" aria-hidden="true" />
              <span className="text-sm font-semibold text-(--stage-spotlight-gold)">
                {result.points} points
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
