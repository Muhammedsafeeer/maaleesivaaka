import { Mic2, Coffee } from "lucide-react";
import { PhotoThumbnail } from "@/components/tables/PhotoThumbnail";
import { CATEGORIES, STAGE_TYPES } from "@/constants/programs";
import type { Program, FixtureBreak } from "@/types/program";
import type { GroupLeaderboardRow } from "@/lib/services/leaderboard.service";

const categoryLabels = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]));
const stageLabels = Object.fromEntries(STAGE_TYPES.map((s) => [s.value, s.label]));

/**
 * On-stage slide — plain `.tv-*` classes so PC and the hall TV match when Tailwind
 * utilities are ignored. House photos use hard `sizePx` to stop intrinsic images
 * blowing up (the pink house-logo failure on the TV).
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
  // Hall TV: only the live on-stage program(s) / breaks — off-stage scoring stays off this slide.
  const onStagePrograms = programs.filter((p) => p.stage_type === "on_stage");
  const onStageBreaks = currentBreaks.filter((b) => b.stage_type === "on_stage");
  if (onStagePrograms.length === 0 && onStageBreaks.length === 0) return null;

  // A break takes the whole slide in large type rather than sharing a small card with
  // a performing program — the fixture only ever runs one "current" entry per
  // stage_type at a time, so a break showing here never actually has an on-stage
  // program to pair with anyway.
  if (onStagePrograms.length === 0) {
    return (
      <div className="tv-slide">
        <div className="tv-break">
          <div className="tv-break-cell">
            <span className="tv-break-icon">
              <Coffee style={{ width: 96, height: 96 }} />
            </span>
            <p className="tv-slide-kicker">Break</p>
            <p className="tv-break-title">{onStageBreaks[0].label}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tv-slide">
      <p className="tv-slide-kicker">On Stage Now</p>

      <div className="tv-card-row">
        {onStagePrograms.map((program) => {
          const houses = housesByProgram[program.id] ?? [];
          return (
            <div key={program.id} className="tv-card">
              {houses.length > 0 ? (
                <div className="tv-house-row">
                  {houses.slice(0, 4).map((house) => (
                    <PhotoThumbnail
                      key={house.id}
                      url={house.photo_url}
                      alt={`${house.name} photo`}
                      className="tv-photo rounded-full"
                      sizePx={72}
                      style={{ borderRadius: "999px", marginLeft: -8 }}
                    />
                  ))}
                </div>
              ) : (
                <span className="tv-card-icon">
                  <Mic2 style={{ width: 48, height: 48 }} />
                </span>
              )}

              <span className="tv-card-badge">{stageLabels[program.stage_type]}</span>
              <p className="tv-card-title">{program.name}</p>
              <p className="tv-card-sub">{categoryLabels[program.category]}</p>
              {houses.length > 0 ? (
                <p className="tv-card-houses">{houses.map((h) => h.name).join(" · ")}</p>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
