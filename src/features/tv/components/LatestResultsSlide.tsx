import { Sparkles } from "lucide-react";
import { PhotoThumbnail } from "@/components/tables/PhotoThumbnail";
import { CATEGORIES } from "@/constants/programs";
import type { LatestResultStudentRow } from "@/lib/services/result.service";

const categoryLabels = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]));
const POSITION_LABELS: Record<number, string> = { 1: "1st", 2: "2nd", 3: "3rd" };
const MAX_SHOWN = 6;

/**
 * "Latest Results" slide — every podium position across every published program,
 * recency-sorted (D-020's exception, same as the interactive /audience feed, reused
 * unchanged here). Distinct from LatestWinnerSlide (that's one program's full top 3);
 * this is a broader "what's just happened" feed mixing programs and positions.
 */
export function LatestResultsSlide({ results }: { results: LatestResultStudentRow[] }) {
  if (results.length === 0) return null;
  const shown = results.slice(0, MAX_SHOWN);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-10 px-16 py-12">
      <div className="flex items-center gap-3">
        <Sparkles className="size-7 text-(--stage-spotlight-gold)" aria-hidden="true" />
        <p className="text-2xl font-bold tracking-[0.3em] text-(--stage-spotlight-gold) uppercase">
          Latest Results
        </p>
      </div>

      <div className="grid w-full max-w-4xl grid-cols-2 gap-5">
        {shown.map((result, i) => (
          <div
            key={result.id}
            className="animate-in fade-in slide-in-from-bottom-4 flex items-center gap-4 rounded-2xl bg-(--stage-spotlight-card) px-5 py-4 fill-mode-both"
            style={{ animationDelay: `${i * 100}ms`, animationDuration: "600ms" }}
          >
            <PhotoThumbnail
              url={result.studentPhotoUrl}
              alt={`${result.studentName} photo`}
              className="size-14 shrink-0 rounded-full"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-bold text-(--stage-spotlight-ink)">
                {result.studentName}
              </p>
              <p className="truncate text-sm text-(--stage-spotlight-ink-dim)">
                {result.programName} · {categoryLabels[result.programCategory]}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-(--stage-spotlight-gold)/15 px-3 py-1 text-xs font-bold text-(--stage-spotlight-gold)">
              {POSITION_LABELS[result.position] ?? `#${result.position}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
