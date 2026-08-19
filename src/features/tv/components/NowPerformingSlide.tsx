import { Mic2 } from "lucide-react";
import { Lantern } from "@/features/leaderboard/components/MotifIcons";
import { PhotoThumbnail } from "@/components/tables/PhotoThumbnail";
import { CATEGORIES, STAGE_TYPES } from "@/constants/programs";
import type { Program } from "@/types/program";
import type { GroupLeaderboardRow } from "@/lib/services/leaderboard.service";

const categoryLabels = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]));
const stageLabels = Object.fromEntries(STAGE_TYPES.map((s) => [s.value, s.label]));

/**
 * "Ongoing program" slide — whatever's currently on stage/off stage right now
 * (programs.status === 'scoring', same signal /audience's "Now Performing" section
 * uses). No individual student photo here on purpose: nobody's been scored yet at this
 * point, so there's no student identity to show. For a GROUP program, though, the
 * competing HOUSES are already known (their team entries exist before scoring starts)
 * and house photos are already fully public (D-002/D-017) — `housesByProgram` shows
 * those instead of a generic icon, the closest thing to "a photo" this slide can show
 * honestly.
 */
export function NowPerformingSlide({
  programs,
  housesByProgram,
}: {
  programs: Program[];
  housesByProgram: Record<string, GroupLeaderboardRow[]>;
}) {
  if (programs.length === 0) return null;

  return (
    <div className="flex h-full flex-col items-center justify-center gap-10 px-16 py-12">
      <div className="flex items-center gap-3">
        <Mic2 className="size-7 text-(--stage-spotlight-gold)" aria-hidden="true" />
        <p className="text-2xl font-bold tracking-[0.3em] text-(--stage-spotlight-gold) uppercase">
          On Stage Now
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-8">
        {programs.map((program, i) => {
          const houses = housesByProgram[program.id] ?? [];
          return (
            <div
              key={program.id}
              className="animate-in fade-in zoom-in-95 relative flex w-96 flex-col items-center gap-4 overflow-hidden rounded-3xl bg-(--stage-spotlight-card) px-10 py-12 text-center shadow-2xl fill-mode-both"
              style={{ animationDelay: `${i * 150}ms`, animationDuration: "700ms" }}
            >
              <Lantern className="lantern-glow absolute -top-4 -right-4 size-24 text-(--stage-spotlight-gold)/15" />

              {houses.length > 0 ? (
                <div className="flex -space-x-3">
                  {houses.slice(0, 4).map((house) => (
                    <PhotoThumbnail
                      key={house.id}
                      url={house.photo_url}
                      alt={`${house.name} photo`}
                      className="size-16 rounded-full border-2 border-(--stage-spotlight-card)"
                    />
                  ))}
                </div>
              ) : (
                <span className="flex size-16 items-center justify-center rounded-2xl bg-(--stage-spotlight-gold)/15 text-(--stage-spotlight-gold)">
                  <Mic2 className="size-8" />
                </span>
              )}

              <span className="w-fit rounded-full bg-(--stage-spotlight-gold)/20 px-3 py-1 text-xs font-bold tracking-wide text-(--stage-spotlight-gold) uppercase">
                {stageLabels[program.stage_type]}
              </span>
              <p className="font-[family-name:var(--font-audience-display)] text-3xl font-bold text-(--stage-spotlight-ink)">
                {program.name}
              </p>
              <p className="text-lg text-(--stage-spotlight-ink-dim)">
                {categoryLabels[program.category]}
              </p>
              {houses.length > 0 ? (
                <p className="text-sm font-medium text-(--stage-spotlight-gold)">
                  {houses.map((h) => h.name).join(" · ")}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
