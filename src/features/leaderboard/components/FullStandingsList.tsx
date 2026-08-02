import { cn } from "@/lib/utils";
import { PhotoThumbnail } from "@/components/tables/PhotoThumbnail";
import type { GroupLeaderboardRow } from "@/lib/services/leaderboard.service";

const RANK_MEDAL: Record<number, string> = {
  1: "var(--podium-gold)",
  2: "var(--podium-silver)",
  3: "var(--podium-bronze)",
};

/**
 * The full house ranking as a compact table — light ground, one row per house — matching
 * the Kerala Kalolsavam reference's "Leading Districts" table (distinct from the dark
 * top-3 podium hero higher up the page, which is `AudienceLeaderboard`). Anchor target
 * for that podium's "View detailed standings" link (`#full-standings` in
 * audience/page.tsx). Top 3 get their podium medal colour on the rank chip and a
 * matching ring on the photo, so the same "who's leading" story reads consistently
 * whether you're looking at the hero above or this table.
 */
export function FullStandingsList({ rows }: { rows: GroupLeaderboardRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-(--stage-ink)/50">
        The leaderboard fills in once judges start submitting scores.
      </p>
    );
  }

  return (
    <ol className="flex flex-col divide-y divide-(--stage-gold-dim)/15">
      {rows.map((group) => {
        const medal = RANK_MEDAL[group.rank];
        return (
          <li key={group.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
            <span
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-bold tabular-nums",
                medal ? "text-(--stage-ink)" : "bg-(--stage-cream-deep) text-(--stage-ink)/70",
              )}
              style={medal ? { background: medal } : undefined}
            >
              {group.rank}
            </span>
            <PhotoThumbnail
              url={group.photo_url}
              alt={`${group.name} photo`}
              className={cn("size-8", medal && "ring-2 ring-offset-1")}
              style={medal ? ({ "--tw-ring-color": medal } as React.CSSProperties) : undefined}
            />
            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-(--stage-ink)">
              {group.name}
            </span>
            <span className="shrink-0 font-mono text-sm font-bold tabular-nums text-(--section-sapphire)">
              {group.total_points}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
