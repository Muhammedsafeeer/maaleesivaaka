import { Activity } from "lucide-react";
import { CATEGORIES } from "@/constants/programs";
import type { CategoryStatus } from "@/lib/services/program.service";

const categoryLabels = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]));

function pct(declared: number, total: number) {
  return total === 0 ? 0 : Math.round((declared / total) * 100);
}

/**
 * "Status of Festival" slide — declared (published) vs. scheduled programs per
 * category, same data /audience's FestivalStatus panel uses (listCategoryStatus()),
 * just full-screen and bigger. Gives the room a sense of how far through the day the
 * festival is, not just who's currently winning.
 */
export function FestivalStatusSlide({ statuses }: { statuses: CategoryStatus[] }) {
  const totalDeclared = statuses.reduce((sum, s) => sum + s.declared, 0);
  const totalAll = statuses.reduce((sum, s) => sum + s.total, 0);
  if (totalAll === 0) return null;
  const overallPct = pct(totalDeclared, totalAll);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-(--tv-40) px-(--tv-64) py-(--tv-48)">
      <div className="flex items-center gap-(--tv-12)">
        <Activity className="size-(--tv-28) text-(--stage-spotlight-gold)" aria-hidden="true" />
        <p className="text-[length:var(--tv-24)] font-bold tracking-[0.3em] text-(--stage-spotlight-gold) uppercase">
          Status of Festival
        </p>
      </div>

      <div className="flex flex-col items-center gap-(--tv-8)">
        <p className="font-mono text-[length:var(--tv-72)] font-extrabold tabular-nums text-(--stage-spotlight-gold)">
          {overallPct}%
        </p>
        <p className="text-[length:var(--tv-14)] font-semibold tracking-[0.2em] text-(--stage-spotlight-ink-dim) uppercase">
          {totalDeclared} of {totalAll} programs declared
        </p>
      </div>

      <div className="grid w-[min(90vw,56rem)] grid-cols-3 gap-(--tv-20)">
        {statuses
          .filter((status) => status.total > 0)
          .map((status, i) => {
            const p = pct(status.declared, status.total);
            return (
              <div
                key={status.category}
                className="animate-in fade-in slide-in-from-bottom-4 flex flex-col gap-(--tv-8) rounded-2xl bg-(--stage-spotlight-card) p-(--tv-16) fill-mode-both"
                style={{ animationDelay: `${i * 80}ms`, animationDuration: "600ms" }}
              >
                <p className="text-[length:var(--tv-12)] font-semibold tracking-wide text-(--stage-spotlight-ink-dim) uppercase">
                  {categoryLabels[status.category]}
                </p>
                <p className="font-[family-name:var(--font-audience-display)] text-[length:var(--tv-24)] font-bold text-(--stage-spotlight-ink)">
                  {status.declared} / {status.total}
                </p>
                <div className="h-(--tv-6) overflow-hidden rounded-full bg-(--stage-spotlight-ink)/15">
                  <div
                    className="h-full rounded-full bg-(--stage-spotlight-gold)"
                    style={{ width: `${p}%` }}
                  />
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
