"use client";

import { useEffect, useState, useTransition } from "react";
import { EmptyState } from "@/components/tables/EmptyState";
import { PhotoThumbnail } from "@/components/tables/PhotoThumbnail";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { GroupLeaderboardRow } from "@/lib/services/leaderboard.service";
import type { GroupPointContribution } from "@/lib/services/leaderboard.service";
import { listGroupPointContributionsAction } from "@/features/leaderboard/actions/groupPointContributions.action";

const medalClass: Record<number, string> = {
  1: "text-podium-gold",
  2: "text-podium-silver",
  3: "text-podium-bronze",
};

const POSITION_LABELS: Record<number, string> = { 1: "1st", 2: "2nd", 3: "3rd" };

function GroupPointsDialog({
  group,
  onOpenChange,
}: {
  group: GroupLeaderboardRow | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [contributions, setContributions] = useState<GroupPointContribution[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!group) return;
    startTransition(async () => {
      const rows = await listGroupPointContributionsAction(group.id);
      setContributions(rows);
    });
  }, [group]);

  return (
    <Dialog open={group !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{group?.name} — students by points</DialogTitle>
          <DialogDescription>
            Every result that contributes to this house&apos;s {group?.total_points} total
            points. A group program&apos;s points are shared by the whole team, shown here
            against each member.
          </DialogDescription>
        </DialogHeader>

        {isPending ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>
        ) : contributions.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No scored results for this house yet.
          </p>
        ) : (
          <ol className="flex max-h-96 flex-col gap-1.5 overflow-y-auto">
            {contributions.map((row) => (
              <li
                key={row.id}
                className="flex items-center gap-3 rounded-lg border border-border px-3 py-2"
              >
                <PhotoThumbnail url={row.studentPhotoUrl} alt={`${row.studentName} photo`} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {row.studentName}
                    {row.isTeamResult ? (
                      <Badge variant="outline" className="ml-1.5 align-middle text-[0.65rem]">
                        Team
                      </Badge>
                    ) : null}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {row.programName} · {POSITION_LABELS[row.position] ?? `#${row.position}`}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold tabular-nums">
                  {row.points} pts
                </span>
              </li>
            ))}
          </ol>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Shared by the admin dashboard's top-5 preview and the full /admin/leaderboard page —
 * components/README.md: "page shells shared by admin and judge" covers shared admin
 * surfaces too, not just admin/judge splits. `compact` tightens row padding for the
 * dashboard preview, where it sits side by side with the students preview. Clicking a
 * house opens a drill-down of which students' results actually contributed to its
 * total — admin-only (listGroupPointContributionsAction re-checks), never shown on the
 * audience side (D-017 keeps every public leaderboard surface house-only). */
export function LeaderboardList({
  rows,
  compact = false,
}: {
  rows: GroupLeaderboardRow[];
  compact?: boolean;
}) {
  const [selectedGroup, setSelectedGroup] = useState<GroupLeaderboardRow | null>(null);

  if (rows.length === 0) {
    return (
      <EmptyState
        title="No results yet"
        description="The leaderboard fills in once judges start submitting scores."
      />
    );
  }

  return (
    <>
      <ol className="flex flex-col gap-1.5">
        {rows.map((group) => (
          <li key={group.id}>
            <button
              type="button"
              onClick={() => setSelectedGroup(group)}
              className={cn(
                "flex w-full items-center justify-between gap-4 rounded-lg border border-podium-gold/25 bg-podium-gold/5 text-left transition-colors hover:bg-podium-gold/10",
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
            </button>
          </li>
        ))}
      </ol>

      <GroupPointsDialog
        group={selectedGroup}
        onOpenChange={(open) => {
          if (!open) setSelectedGroup(null);
        }}
      />
    </>
  );
}
