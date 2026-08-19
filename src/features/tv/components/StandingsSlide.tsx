import { TrophyCup } from "@/features/leaderboard/components/MotifIcons";
import { PhotoThumbnail } from "@/components/tables/PhotoThumbnail";
import { cn } from "@/lib/utils";
import type { GroupLeaderboardRow } from "@/lib/services/leaderboard.service";

const RANK_TONES = { 1: "gold", 2: "silver", 3: "bronze" } as const;

/**
 * "Wide background, clear group points" — the biggest, plainest slide on purpose: a
 * top-3 podium with real trophy illustrations, then a dense ranked list for everyone
 * else, all in giant tabular-nums so the total is readable from across a hall.
 */
export function StandingsSlide({ groups }: { groups: GroupLeaderboardRow[] }) {
  const top3 = groups.filter((g) => g.rank <= 3).sort((a, b) => a.rank - b.rank);
  const rest = groups.filter((g) => g.rank > 3).sort((a, b) => a.rank - b.rank);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-(--tv-40) px-(--tv-64) py-(--tv-48)">
      <p className="text-[length:var(--tv-24)] font-bold tracking-[0.3em] text-(--stage-spotlight-gold) uppercase">
        Overall Standings
      </p>

      <div className="flex items-end gap-(--tv-32)">
        {top3.map((group, i) => {
          const tone = RANK_TONES[group.rank as 1 | 2 | 3] ?? "bronze";
          const isLeader = group.rank === 1;
          return (
            <div
              key={group.id}
              className={cn(
                "animate-in fade-in slide-in-from-bottom-8 flex flex-col items-center gap-(--tv-12) rounded-3xl bg-(--stage-spotlight-card) px-(--tv-32) text-center shadow-2xl fill-mode-both",
                // 2nd-1st-3rd left to right, like a real podium — the leader sits
                // tallest and centered rather than first in rank order.
                isLeader ? "order-2 pt-(--tv-64) pb-(--tv-40)" : "order-1 pt-(--tv-40) pb-(--tv-32) last:order-3",
              )}
              style={{ animationDelay: `${i * 150}ms`, animationDuration: "700ms" }}
            >
              <TrophyCup
                tone={tone}
                className={cn(isLeader ? "lantern-glow size-(--tv-128)" : "size-(--tv-80)")}
              />
              {group.photo_url ? (
                <PhotoThumbnail
                  url={group.photo_url}
                  alt={`${group.name} photo`}
                  className={isLeader ? "size-(--tv-96) rounded-full" : "size-(--tv-64) rounded-full"}
                />
              ) : null}
              <p
                className={cn(
                  "font-[family-name:var(--font-audience-display)] font-bold text-(--stage-spotlight-ink)",
                  isLeader ? "text-[length:var(--tv-36)]" : "text-[length:var(--tv-24)]",
                )}
              >
                {group.name}
              </p>
              <p
                className={cn(
                  "font-mono font-extrabold tabular-nums text-(--stage-spotlight-gold)",
                  isLeader ? "text-[length:var(--tv-60)]" : "text-[length:var(--tv-36)]",
                )}
              >
                {group.total_points}
              </p>
              <p className="text-[length:var(--tv-12)] font-semibold tracking-[0.2em] text-(--stage-spotlight-ink-dim) uppercase">
                Points
              </p>
            </div>
          );
        })}
      </div>

      {rest.length > 0 ? (
        <div className="flex flex-wrap justify-center gap-(--tv-16)">
          {rest.map((group, i) => (
            <div
              key={group.id}
              className="animate-in fade-in flex items-center gap-(--tv-12) rounded-2xl bg-(--stage-spotlight-card)/60 px-(--tv-20) py-(--tv-12) fill-mode-both"
              style={{ animationDelay: `${600 + i * 80}ms`, animationDuration: "500ms" }}
            >
              <span className="font-mono text-[length:var(--tv-18)] font-bold text-(--stage-spotlight-ink-dim)">
                #{group.rank}
              </span>
              <span className="text-[length:var(--tv-18)] font-semibold text-(--stage-spotlight-ink)">
                {group.name}
              </span>
              <span className="font-mono text-[length:var(--tv-18)] font-bold tabular-nums text-(--stage-spotlight-gold)">
                {group.total_points}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
