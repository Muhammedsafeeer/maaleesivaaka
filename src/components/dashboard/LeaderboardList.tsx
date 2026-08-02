import { EmptyState } from "@/components/tables/EmptyState";
import { PhotoThumbnail } from "@/components/tables/PhotoThumbnail";
import { cn } from "@/lib/utils";
import type { GroupLeaderboardRow } from "@/lib/services/leaderboard.service";

const medalClass: Record<number, string> = {
  1: "text-podium-gold",
  2: "text-podium-silver",
  3: "text-podium-bronze",
};

/** Shared by the admin dashboard's top-5 preview and the full /admin/leaderboard page —
 * components/README.md: "page shells shared by admin and judge" covers shared admin
 * surfaces too, not just admin/judge splits. `compact` tightens row padding for the
 * dashboard preview, where it sits side by side with the students preview. */
export function LeaderboardList({
  rows,
  compact = false,
}: {
  rows: GroupLeaderboardRow[];
  compact?: boolean;
}) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title="No results yet"
        description="The leaderboard fills in once judges start submitting scores."
      />
    );
  }

  return (
    <ol className="flex flex-col gap-1.5">
      {rows.map((group) => (
        <li
          key={group.id}
          className={cn(
            "flex items-center justify-between gap-4 rounded-lg border border-podium-gold/25 bg-podium-gold/5",
            compact ? "px-2.5 py-1.5" : "px-3 py-2",
          )}
        >
          <span className="flex min-w-0 items-center gap-3">
            <span
              className={cn(
                "w-5 shrink-0 font-mono text-sm font-semibold tabular-nums",
                medalClass[group.rank] ?? "text-muted-foreground",
              )}
            >
              #{group.rank}
            </span>
            <PhotoThumbnail url={group.photo_url} alt={`${group.name} photo`} />
            <span className="truncate font-medium">{group.name}</span>
          </span>
          <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
            {group.total_points} pts
          </span>
        </li>
      ))}
    </ol>
  );
}
