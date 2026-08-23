import { Mic2, Coffee } from "lucide-react";
import { Lantern } from "@/features/leaderboard/components/MotifIcons";
import { PhotoThumbnail } from "@/components/tables/PhotoThumbnail";
import { CATEGORIES, STAGE_TYPES } from "@/constants/programs";
import type { Program, FixtureBreak } from "@/types/program";
import type { GroupLeaderboardRow } from "@/lib/services/leaderboard.service";

const categoryLabels = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]));
const stageLabels = Object.fromEntries(STAGE_TYPES.map((s) => [s.value, s.label]));

/**
 * "Ongoing program" slide — whatever's currently on stage/off stage right now
 * (programs.status === 'scoring', same signal /audience's "Now Performing" section
 * uses) — OR a currently-active break (fixture_breaks.status === 'scoring') on a stage
 * with nothing else current. No individual student photo here on purpose: nobody's
 * been scored yet at this point, so there's no student identity to show. For a GROUP
 * program, though, the competing HOUSES are already known (their team entries exist
 * before scoring starts) and house photos are already fully public (D-002/D-017) —
 * `housesByProgram` shows those instead of a generic icon, the closest thing to "a
 * photo" this slide can show honestly.
 */
export function NowPerformingSlide({
  programs,
  currentBreaks,
  housesByProgram,
}: {
  programs: Program[];
  currentBreaks: FixtureBreak[];
  housesByProgram: Record<string, GroupLeaderboardRow[]>;
}) {
  if (programs.length === 0 && currentBreaks.length === 0) return null;

  return (
    <div className="flex h-full flex-col items-center justify-center gap-(--tv-40) px-(--tv-64) py-(--tv-48)">
      <div className="flex items-center gap-(--tv-12)">
        <Mic2 className="size-(--tv-28) text-(--stage-spotlight-gold)" aria-hidden="true" />
        <p className="text-[length:var(--tv-24)] font-bold tracking-[0.3em] text-(--stage-spotlight-gold) uppercase">
          On Stage Now
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-(--tv-32)">
        {programs.map((program, i) => {
          const houses = housesByProgram[program.id] ?? [];
          return (
            <div
              key={program.id}
              className="animate-in fade-in zoom-in-95 relative flex w-(--tv-384) flex-col items-center gap-(--tv-16) overflow-hidden rounded-3xl bg-(--stage-spotlight-card) px-(--tv-40) py-(--tv-48) text-center shadow-2xl fill-mode-both"
              style={{ animationDelay: `${i * 150}ms`, animationDuration: "700ms" }}
            >
              <Lantern className="lantern-glow absolute -top-(--tv-16) -right-(--tv-16) size-(--tv-96) text-(--stage-spotlight-gold)/15" />

              {houses.length > 0 ? (
                <div className="flex -space-x-3">
                  {houses.slice(0, 4).map((house) => (
                    <PhotoThumbnail
                      key={house.id}
                      url={house.photo_url}
                      alt={`${house.name} photo`}
                      className="size-(--tv-64) rounded-full border-2 border-(--stage-spotlight-card)"
                    />
                  ))}
                </div>
              ) : (
                <span className="flex size-(--tv-64) items-center justify-center rounded-2xl bg-(--stage-spotlight-gold)/15 text-(--stage-spotlight-gold)">
                  <Mic2 className="size-(--tv-32)" />
                </span>
              )}

              <span className="w-fit rounded-full bg-(--stage-spotlight-gold)/20 px-(--tv-12) py-(--tv-4) text-[length:var(--tv-12)] font-bold tracking-wide text-(--stage-spotlight-gold) uppercase">
                {stageLabels[program.stage_type]}
              </span>
              <p className="font-[family-name:var(--font-audience-display)] text-[length:var(--tv-36)] font-bold text-(--stage-spotlight-ink)">
                {program.name}
              </p>
              <p className="text-[length:var(--tv-18)] text-(--stage-spotlight-ink-dim)">
                {categoryLabels[program.category]}
              </p>
              {houses.length > 0 ? (
                <p className="text-[length:var(--tv-14)] font-medium text-(--stage-spotlight-gold)">
                  {houses.map((h) => h.name).join(" · ")}
                </p>
              ) : null}
            </div>
          );
        })}

        {currentBreaks.map((brk, i) => (
          <div
            key={brk.id}
            className="animate-in fade-in zoom-in-95 relative flex w-(--tv-384) flex-col items-center gap-(--tv-16) overflow-hidden rounded-3xl bg-(--stage-spotlight-card) px-(--tv-40) py-(--tv-48) text-center shadow-2xl fill-mode-both"
            style={{ animationDelay: `${(programs.length + i) * 150}ms`, animationDuration: "700ms" }}
          >
            <Lantern className="lantern-glow absolute -top-(--tv-16) -right-(--tv-16) size-(--tv-96) text-(--stage-spotlight-gold)/15" />

            <span className="flex size-(--tv-64) items-center justify-center rounded-2xl bg-(--stage-spotlight-gold)/15 text-(--stage-spotlight-gold)">
              <Coffee className="size-(--tv-32)" />
            </span>

            <span className="w-fit rounded-full bg-(--stage-spotlight-gold)/20 px-(--tv-12) py-(--tv-4) text-[length:var(--tv-12)] font-bold tracking-wide text-(--stage-spotlight-gold) uppercase">
              {stageLabels[brk.stage_type]}
            </span>
            <p className="font-[family-name:var(--font-audience-display)] text-[length:var(--tv-36)] font-bold text-(--stage-spotlight-ink)">
              {brk.label}
            </p>
            <p className="text-[length:var(--tv-18)] text-(--stage-spotlight-ink-dim)">Break</p>
          </div>
        ))}
      </div>
    </div>
  );
}
