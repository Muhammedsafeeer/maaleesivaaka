import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { TrophyCup } from "@/features/leaderboard/components/MotifIcons";
import type { GroupLeaderboardRow } from "@/lib/services/leaderboard.service";

const RANK_LABELS: Record<number, string> = { 1: "1st", 2: "2nd", 3: "3rd" };
const RANK_TONES = { 1: "gold", 2: "silver", 3: "bronze" } as const;

function PodiumCard({ group, isLeader }: { group: GroupLeaderboardRow; isLeader: boolean }) {
  const tone = RANK_TONES[group.rank as 1 | 2 | 3] ?? "bronze";

  return (
    <div
      className={cn(
        "relative flex flex-1 flex-col items-center gap-1 rounded-2xl bg-(--stage-spotlight-card) px-2 pb-4 text-center",
        isLeader ? "order-2 pt-14 pb-6 shadow-lg ring-1 ring-(--stage-spotlight-gold)/30" : "order-1 pt-10 last:order-3",
      )}
    >
      {isLeader ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-6 left-1/2 size-28 -translate-x-1/2 rounded-full bg-(--stage-spotlight-gold) opacity-25 blur-2xl"
        />
      ) : null}

      <TrophyCup
        tone={tone}
        className={cn("lantern-glow absolute -top-9 drop-shadow-md", isLeader ? "size-16" : "size-11")}
      />

      <span
        className={cn(
          "w-fit rounded-full px-2 py-0.5 text-[0.6rem] font-bold tracking-wide uppercase",
          isLeader
            ? "bg-(--stage-spotlight-gold)/20 text-(--stage-spotlight-gold)"
            : "bg-(--stage-spotlight-ink)/10 text-(--stage-spotlight-ink-dim)",
        )}
      >
        {RANK_LABELS[group.rank] ?? `#${group.rank}`}
      </span>
      <span
        className={cn(
          "mt-1 truncate font-[family-name:var(--font-audience-display)] font-bold text-(--stage-spotlight-ink)",
          isLeader ? "text-xl" : "text-sm",
        )}
      >
        {group.name}
      </span>
      <span
        className={cn(
          "font-mono font-extrabold tabular-nums text-(--stage-spotlight-gold)",
          isLeader ? "text-3xl" : "text-lg",
        )}
      >
        {group.total_points}
      </span>
      <span className="text-[0.6rem] font-semibold tracking-widest text-(--stage-spotlight-ink-dim) uppercase">
        Points
      </span>
    </div>
  );
}

/**
 * Audience-only leaderboard hero — top-3 podium only (a real illustrated trophy cup per
 * position, gold/silver/bronze, not a generic outline icon), matching the Kerala
 * Kalolsavam reference's "Leading Districts" panel: no photos, no houses-4-and-below
 * list here — those live in the separate full-standings table further down the page
 * (see audience/page.tsx's `#full-standings` section), same split as the reference's
 * dark hero podium vs. its later light "Leading Districts" table. Always rendered
 * inside an `OrnateFrame surface="spotlight"`.
 *
 * No `overflow-hidden` on the card itself — the cup and its glow both sit above the
 * card's own top edge (`-top-9`/`-top-6`), and clipping them there was a real bug: a
 * previous pass added `overflow-hidden` for the glow effect without noticing it also
 * silently clipped the trophy.
 */
export function AudienceLeaderboard({ rows }: { rows: GroupLeaderboardRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-(--stage-spotlight-ink)/60">
        The leaderboard fills in once judges start submitting scores.
      </p>
    );
  }

  const top3 = rows.filter((r) => r.rank <= 3).sort((a, b) => a.rank - b.rank);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end gap-3 pt-6">
        {top3.map((group) => (
          <PodiumCard key={group.id} group={group} isLeader={group.rank === 1} />
        ))}
      </div>
      {rows.length > 3 ? (
        <a
          href="#full-standings"
          className="mx-auto flex items-center gap-1 text-xs font-semibold tracking-wide text-(--stage-spotlight-gold) uppercase hover:underline"
        >
          View detailed standings
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </a>
      ) : null}
    </div>
  );
}
