import { EmptyState } from "@/components/tables/EmptyState";
import { PhotoThumbnail } from "@/components/tables/PhotoThumbnail";
import type { GroupLeaderboardRow } from "@/lib/services/leaderboard.service";

/** Shared by the admin dashboard's top-5 preview and the full /admin/leaderboard page —
 * components/README.md: "page shells shared by admin and judge" covers shared admin
 * surfaces too, not just admin/judge splits. */
export function LeaderboardList({ rows }: { rows: GroupLeaderboardRow[] }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title="No results yet"
        description="The leaderboard fills in once judges start submitting scores."
      />
    );
  }

  return (
    <ol className="flex flex-col gap-2">
      {rows.map((group) => (
        <li
          key={group.id}
          className="flex items-center justify-between gap-4 rounded-lg border border-border px-3 py-2"
        >
          <span className="flex items-center gap-3">
            <span className="text-sm font-mono tabular-nums text-muted-foreground">
              #{group.rank}
            </span>
            <PhotoThumbnail url={group.photo_url} alt={`${group.name} photo`} />
            <span className="font-medium">{group.name}</span>
          </span>
          <span className="text-sm tabular-nums text-muted-foreground">
            {group.total_points} pts
          </span>
        </li>
      ))}
    </ol>
  );
}
