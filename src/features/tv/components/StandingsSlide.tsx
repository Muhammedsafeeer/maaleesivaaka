import { TrophyCup } from "@/features/leaderboard/components/MotifIcons";
import { PhotoThumbnail } from "@/components/tables/PhotoThumbnail";
import type { GroupLeaderboardRow } from "@/lib/services/leaderboard.service";

const RANK_TONES = { 1: "gold", 2: "silver", 3: "bronze" } as const;

/**
 * Overall standings — horizontal table cards (Panasonic ignores flex).
 * Name + score sit on one row so hall-TV browser chrome cannot clip the points
 * the way the old tall vertical cards did. Just Declared already uses this
 * short-card pattern successfully.
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
              <table className="tv-podium-table" cellPadding={0} cellSpacing={0}>
                <tbody>
                  <tr>
                    <td className="tv-podium-td-media">
                      <TrophyCup
                        tone={tone}
                        className={`tv-podium-trophy${isLeader ? " is-leader" : ""}`}
                      />
                      {group.photo_url ? (
                        <PhotoThumbnail
                          url={group.photo_url}
                          alt={`${group.name} photo`}
                          className={`tv-photo rounded-full${isLeader ? " is-leader" : ""}`}
                          sizePx={80}
                          style={{ borderRadius: "999px" }}
                        />
                      ) : null}
                    </td>
                    <td className="tv-podium-td-name">
                      <p className="tv-podium-name">{group.name}</p>
                      <p className="tv-podium-label">Points</p>
                    </td>
                    <td className="tv-podium-td-score">
                      <p className="tv-podium-points">{group.total_points}</p>
                    </td>
                  </tr>
                </tbody>
              </table>
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
