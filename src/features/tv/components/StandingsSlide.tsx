import { TrophyCup } from "@/features/leaderboard/components/MotifIcons";
import { PhotoThumbnail } from "@/components/tables/PhotoThumbnail";
import type { GroupLeaderboardRow } from "@/lib/services/leaderboard.service";

const RANK_TONES = { 1: "gold", 2: "silver", 3: "bronze" } as const;

/**
 * Overall standings — equal-height horizontal cards that fill the slide
 * (Panasonic ignores flex; absolute pair layout + table cells).
 * Leader keeps a gold border only — same size as the other house so both
 * read as equal full-screen rows on the hall TV.
 */
export function StandingsSlide({ groups }: { groups: GroupLeaderboardRow[] }) {
  const top3 = groups.filter((g) => g.rank <= 3).sort((a, b) => a.rank - b.rank);
  const rest = groups.filter((g) => g.rank > 3).sort((a, b) => a.rank - b.rank);

  // Rank order for display when exactly two houses: leader first, then 2nd.
  // (Classic 2-1-3 podium order is for three cards; with two, equal stacked rows
  // read better with #1 on top.)
  const twoHouse = top3.length === 2 && rest.length === 0;
  const podium = twoHouse
    ? [top3.find((g) => g.rank === 1), top3.find((g) => g.rank === 2)].filter(
        (g): g is GroupLeaderboardRow => Boolean(g),
      )
    : [top3.find((g) => g.rank === 2), top3.find((g) => g.rank === 1), top3.find((g) => g.rank === 3)].filter(
        (g): g is GroupLeaderboardRow => Boolean(g),
      );

  const slideClass =
    podium.length === 2 && rest.length === 0 ? "tv-slide tv-slide-standings is-pair" : "tv-slide tv-slide-standings";

  return (
    <div className={slideClass}>
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
                          sizePx={120}
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
