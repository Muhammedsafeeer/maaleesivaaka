import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORIES } from "@/constants/programs";
import type { CategoryStatus } from "@/lib/services/program.service";

const categoryLabels = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]));

function pct(declared: number, total: number) {
  return total === 0 ? 0 : Math.round((declared / total) * 100);
}

/**
 * Audience "Status of Festival" panel — per-category declared/total, plus an overall
 * card. Mirrors the reference layout's category tiles + highlighted overall box, in the
 * green/gold theme. A category with zero scheduled programs reads as "—", never a
 * misleading 0%/0% that looks like a stalled festival.
 */
export function FestivalStatus({ statuses }: { statuses: CategoryStatus[] }) {
  const totalDeclared = statuses.reduce((sum, s) => sum + s.declared, 0);
  const totalAll = statuses.reduce((sum, s) => sum + s.total, 0);
  const overallPct = pct(totalDeclared, totalAll);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {statuses.map((status) => {
        const isEmpty = status.total === 0;
        const complete = !isEmpty && status.declared === status.total;
        return (
          <div
            key={status.category}
            className="flex flex-col gap-2 rounded-xl bg-(--stage-ivory) p-3 shadow-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-[0.65rem] font-semibold tracking-wide text-(--stage-ink)/60 uppercase">
                {categoryLabels[status.category]}
              </p>
              {complete ? (
                <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-(--house-green)">
                  <Check className="size-3 text-(--stage-ivory)" strokeWidth={3} />
                </span>
              ) : null}
            </div>
            <p className="font-[family-name:var(--font-audience-display)] text-2xl font-bold text-(--stage-ink)">
              {isEmpty ? "—" : `${status.declared} / ${status.total}`}
            </p>
            <div className="h-1.5 overflow-hidden rounded-full bg-(--stage-ink)/10">
              <div
                className="h-full rounded-full bg-(--house-green)"
                style={{ width: `${isEmpty ? 0 : pct(status.declared, status.total)}%` }}
              />
            </div>
            <p className="text-[0.65rem] text-(--stage-ink)/50">
              {isEmpty ? "No programs yet" : `${pct(status.declared, status.total)}% declared`}
            </p>
          </div>
        );
      })}

      <div
        className={cn(
          "col-span-2 flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-(--stage-gold) bg-(--stage-green-800) p-3 text-center sm:col-span-4",
        )}
      >
        <p className="text-[0.65rem] font-semibold tracking-wide text-(--stage-gold-bright)/80 uppercase">
          Overall Status
        </p>
        <p className="font-[family-name:var(--font-audience-display)] text-3xl font-bold text-(--stage-gold-bright)">
          {totalAll === 0 ? "—" : `${overallPct}%`}
        </p>
        <div className="h-1.5 w-full max-w-40 overflow-hidden rounded-full bg-(--stage-ivory)/20">
          <div
            className="h-full rounded-full bg-(--stage-gold)"
            style={{ width: `${overallPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
