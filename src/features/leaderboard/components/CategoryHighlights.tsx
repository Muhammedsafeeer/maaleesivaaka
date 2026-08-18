import { Baby, Music2, GraduationCap, Users, Award, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORIES } from "@/constants/programs";
import type { CategoryStatus } from "@/lib/services/program.service";

const categoryLabels = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]));

const TINTS = [
  {
    from: "from-(--section-sapphire)",
    to: "to-(--section-sapphire)/80",
    soft: "bg-(--section-sapphire)/10",
    text: "text-(--section-sapphire)",
    bar: "bg-(--section-sapphire)",
  },
  {
    from: "from-(--section-ruby)",
    to: "to-(--section-ruby)/80",
    soft: "bg-(--section-ruby)/10",
    text: "text-(--section-ruby)",
    bar: "bg-(--section-ruby)",
  },
  {
    from: "from-(--section-amber)",
    to: "to-(--section-amber)/80",
    soft: "bg-(--section-amber)/10",
    text: "text-(--section-amber)",
    bar: "bg-(--section-amber)",
  },
] as const;

const ICONS = [Baby, Users, Music2, GraduationCap, Award, Sparkles];

/**
 * One gradient-header card per category — echoes the Kerala Kalolsavam reference's
 * "Detailed Results" block (vivid full-bleed-header cards, one per category). The reference's cards
 * are navigation hubs into category sub-pages (Results Declared / District Points /
 * School Points) this app doesn't have, so this shows the same real per-category
 * numbers already computed for `FestivalStatus` instead of fabricating links to pages
 * that don't exist.
 */
export function CategoryHighlights({ statuses }: { statuses: CategoryStatus[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {statuses.map((status, index) => {
        const tint = TINTS[index % TINTS.length];
        const Icon = ICONS[index % ICONS.length];
        const isEmpty = status.total === 0;
        const pct = isEmpty ? 0 : Math.round((status.declared / status.total) * 100);

        return (
          <div
            key={status.category}
            className="overflow-hidden rounded-2xl bg-(--stage-ivory) shadow-md"
          >
            <div className={cn("flex items-center gap-2.5 bg-gradient-to-br px-4 py-3", tint.from, tint.to)}>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/20">
                <Icon className="size-4 text-white" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-bold tracking-wide text-white uppercase">
                  {categoryLabels[status.category]}
                </p>
                <p className="text-[0.65rem] text-white/75">Festival Category</p>
              </div>
            </div>
            <div className="flex flex-col gap-3 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-[family-name:var(--font-audience-display)] text-2xl font-bold text-(--stage-ink)">
                    {isEmpty ? "—" : `${status.declared}/${status.total}`}
                  </p>
                  <p className="text-xs text-(--stage-ink)/50">
                    {isEmpty ? "No programs yet" : "Results declared"}
                  </p>
                </div>
                <span
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    tint.soft,
                    tint.text,
                  )}
                >
                  {isEmpty ? "—" : `${pct}%`}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-(--stage-ink)/10">
                <div className={cn("h-full rounded-full", tint.bar)} style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
