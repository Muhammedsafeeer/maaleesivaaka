import { TrophyCup } from "@/features/leaderboard/components/MotifIcons";
import { PhotoThumbnail } from "@/components/tables/PhotoThumbnail";
import type { GroupLeaderboardRow } from "@/lib/services/leaderboard.service";

const RANK_TONES = { 1: "gold", 2: "silver", 3: "bronze" } as const;

/**
 * Overall standings — plain `.tv-*` classes from inlined critical CSS (no Tailwind
 * dependency) so fonts/layout survive TV browsers that skip the main CSS bundle.
 * House photos use hard pixel sizes — CSS vars alone were ignored on the hall TV and
 * the intrinsic image filled half the screen (pink house logo blow-up).
 */
export function StandingsSlide({ groups }: { groups: GroupLeaderboardRow[] }) {
  const top3 = groups.filter((g) => g.rank <= 3).sort((a, b) => a.rank - b.rank);
  const rest = groups.filter((g) => g.rank > 3).sort((a, b) => a.rank - b.rank);

  const podium = [top3.find((g) => g.rank === 2), top3.find((g) => g.rank === 1), top3.find((g) => g.rank === 3)].filter(
    (g): g is GroupLeaderboardRow => Boolean(g),
  );

  return (
    <div className="tv-slide">
      <p className="tv-slide-kicker">Overall Standings</p>

      <div className="tv-podium">
        {podium.map((group) => {
          const tone = RANK_TONES[group.rank as 1 | 2 | 3] ?? "bronze";
          const isLeader = group.rank === 1;
          return (
            <div key={group.id} className={`tv-podium-card${isLeader ? " is-leader" : ""}`}>
              <TrophyCup
                tone={tone}
                className={`tv-podium-trophy${isLeader ? " is-leader" : ""}`}
              />
              {group.photo_url ? (
                <PhotoThumbnail
                  url={group.photo_url}
                  alt={`${group.name} photo`}
                  className={`tv-photo rounded-full${isLeader ? " is-leader" : ""}`}
                  sizePx={isLeader ? 120 : 96}
                  style={{ borderRadius: "999px" }}
                />
              ) : null}
              <p className="tv-podium-name">{group.name}</p>
              <p className="tv-podium-points">{group.total_points}</p>
              <p className="tv-podium-label">Points</p>
            </div>
          );
        })}
      </div>

      {rest.length > 0 ? (
        <div className="tv-rest">
          {rest.map((group) => (
            <div key={group.id} className="tv-rest-chip">
              <span className="tv-rest-rank">#{group.rank}</span>
              <span>{group.name}</span>
              <span className="tv-rest-points">{group.total_points}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
