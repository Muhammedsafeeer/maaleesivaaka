import { Trophy } from "lucide-react";
import { PhotoThumbnail } from "@/components/tables/PhotoThumbnail";
import { cn } from "@/lib/utils";
import type { GroupLeaderboardRow } from "@/lib/services/leaderboard.service";

const HOUSE_TOKENS = [
  "var(--house-red)",
  "var(--house-blue)",
  "var(--house-green)",
  "var(--house-yellow)",
] as const;

/** Deterministic house accent from `id` — house colour isn't stored data (main_groups
 * has no colour column), so the same house always lands on the same accent across
 * renders/ranks without needing one. */
function houseAccent(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return HOUSE_TOKENS[hash % HOUSE_TOKENS.length];
}

const RANK_MEDAL: Record<number, string> = {
  1: "var(--podium-gold)",
  2: "var(--podium-silver)",
  3: "var(--podium-bronze)",
};

function PodiumCard({
  group,
  isLeader,
}: {
  group: GroupLeaderboardRow;
  isLeader: boolean;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-1 flex-col items-center gap-2 rounded-xl bg-(--stage-ivory) px-3 pt-5 pb-4 text-center shadow-sm",
        isLeader ? "order-2 pt-7 pb-5" : "order-1 last:order-3",
      )}
      style={{ borderTop: `4px solid ${houseAccent(group.id)}` }}
    >
      {isLeader ? (
        <Trophy
          className="lantern-glow absolute -top-4 size-7 text-(--stage-gold)"
          aria-hidden="true"
        />
      ) : null}
      <span
        className="flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-(--stage-ink)"
        style={{ background: RANK_MEDAL[group.rank] }}
      >
        {group.rank}
      </span>
      <PhotoThumbnail url={group.photo_url} alt={`${group.name} photo`} className="size-10" />
      <span
        className={cn(
          "truncate font-[family-name:var(--font-audience-display)] font-bold text-(--stage-ink)",
          isLeader ? "text-lg" : "text-base",
        )}
      >
        {group.name}
      </span>
      <span className="font-mono text-xs font-semibold tabular-nums text-(--stage-ink)/60">
        {group.total_points} pts
      </span>
    </div>
  );
}

function RankRow({ group }: { group: GroupLeaderboardRow }) {
  return (
    <li className="flex items-center gap-3 overflow-hidden rounded-xl bg-(--stage-ivory) pr-4 shadow-sm">
      <span
        className="w-1.5 self-stretch shrink-0"
        style={{ background: houseAccent(group.id) }}
        aria-hidden="true"
      />
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-(--stage-ink)/10 text-sm font-bold text-(--stage-ink)">
        {group.rank}
      </span>
      <PhotoThumbnail url={group.photo_url} alt={`${group.name} photo`} />
      <span className="min-w-0 flex-1 truncate font-semibold text-(--stage-ink)">
        {group.name}
      </span>
      <span className="shrink-0 font-mono text-sm font-semibold tabular-nums text-(--stage-ink)/80">
        {group.total_points} pts
      </span>
    </li>
  );
}

/**
 * Audience-only leaderboard display (Phase 17 layout pass) — a top-3 podium (matching
 * the reference's "Leading Districts" hero) with any remaining houses listed below.
 * With this app's real house counts (typically 3-4), the podium usually IS the whole
 * leaderboard — no separate full-standings table needed, unlike the reference's
 * district/school scale. Distinct from the shared `LeaderboardList` used by /admin,
 * which stays on the neutral shadcn theme.
 */
export function AudienceLeaderboard({ rows }: { rows: GroupLeaderboardRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-(--stage-ivory)/60">
        The leaderboard fills in once judges start submitting scores.
      </p>
    );
  }

  const top3 = rows.filter((r) => r.rank <= 3).sort((a, b) => a.rank - b.rank);
  const rest = rows.filter((r) => r.rank > 3);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end gap-3">
        {top3.map((group) => (
          <PodiumCard key={group.id} group={group} isLeader={group.rank === 1} />
        ))}
      </div>
      {rest.length > 0 ? (
        <ol className="flex flex-col gap-2">
          {rest.map((group) => (
            <RankRow key={group.id} group={group} />
          ))}
        </ol>
      ) : null}
    </div>
  );
}
