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
    <div className="flex h-full flex-col items-center justify-center gap-(--tv-40) px-(--tv-64) py-(--tv-48)">
      <div className="flex items-center gap-(--tv-12)">
        <Sparkles className="size-(--tv-28) text-(--stage-spotlight-gold)" aria-hidden="true" />
        <p className="text-[length:var(--tv-24)] font-bold tracking-[0.3em] text-(--stage-spotlight-gold) uppercase">
          Latest Results
        </p>
      </div>

      <div className="grid w-[min(90vw,56rem)] grid-cols-2 gap-(--tv-20)">
        {shown.map((result, i) => (
          <div
            key={result.id}
            className="animate-in fade-in slide-in-from-bottom-4 flex items-center gap-(--tv-16) rounded-2xl bg-(--stage-spotlight-card) px-(--tv-20) py-(--tv-16) fill-mode-both"
            style={{ animationDelay: `${i * 100}ms`, animationDuration: "600ms" }}
          >
            <PhotoThumbnail
              url={result.studentPhotoUrl}
              alt={`${result.studentName} photo`}
              className="size-(--tv-56) shrink-0 rounded-full"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[length:var(--tv-18)] font-bold text-(--stage-spotlight-ink)">
                {result.studentName}
              </p>
              <p className="truncate text-[length:var(--tv-14)] text-(--stage-spotlight-ink-dim)">
                {result.programName} · {categoryLabels[result.programCategory]}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-(--stage-spotlight-gold)/15 px-(--tv-12) py-(--tv-4) text-[length:var(--tv-12)] font-bold text-(--stage-spotlight-gold)">
              {POSITION_LABELS[result.position] ?? `#${result.position}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
