"use client";

import { useEffect, useState, useTransition } from "react";
import { EmptyState } from "@/components/tables/EmptyState";
import { PhotoThumbnail } from "@/components/tables/PhotoThumbnail";
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

/**
 * One row per underlying result, not one per contribution — a team result comes back
 * as one GroupPointContribution per member (so each member's own name/photo is
 * available), but showing every member as its own row would repeat that same shared
 * points value once per member, reading as if each of them separately earned it (e.g.
 * a 5-member team's single 15-point win looking like 75 points at a glance). Grouping
 * by resultId collapses those back into the one shared result they actually are.
 */
type GroupPointsRow = {
  resultId: string;
  points: number;
  position: number;
  programName: string;
  isTeamResult: boolean;
  members: { studentId: string; studentName: string; studentPhotoUrl: string | null }[];
};

function groupContributions(contributions: GroupPointContribution[]): GroupPointsRow[] {
  const rows: GroupPointsRow[] = [];
  const byResultId = new Map<string, GroupPointsRow>();

  for (const c of contributions) {
    const existing = byResultId.get(c.resultId);
    const member = { studentId: c.studentId, studentName: c.studentName, studentPhotoUrl: c.studentPhotoUrl };
    if (existing) {
      existing.members.push(member);
      continue;
    }
    const row: GroupPointsRow = {
      resultId: c.resultId,
      points: c.points,
      position: c.position,
      programName: c.programName,
      isTeamResult: c.isTeamResult,
      members: [member],
    };
    byResultId.set(c.resultId, row);
    rows.push(row);
  }

  return rows;
}

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

  const rows = groupContributions(contributions);

  return (
    <Dialog open={group !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{group?.name} — students by points</DialogTitle>
          <DialogDescription>
            Every result that contributes to this house&apos;s {group?.total_points} total
            points. A group program&apos;s points are shared by the whole team — counted once
            below, not once per member.
          </DialogDescription>
        </DialogHeader>

        {isPending ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No scored results for this house yet.
          </p>
        ) : (
          <ol className="flex max-h-96 flex-col gap-1.5 overflow-y-auto">
            {rows.map((row) =>
              row.isTeamResult ? (
                <li
                  key={row.resultId}
                  className="flex items-center gap-3 rounded-lg border border-border px-3 py-2"
                >
                  <PhotoThumbnail url={group?.photo_url ?? null} alt={`${group?.name} photo`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{group?.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      Team · {row.programName} · {POSITION_LABELS[row.position] ?? `#${row.position}`}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {row.members.map((m) => m.studentName).join(", ")}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums">
                    {row.points} pts
                  </span>
                </li>
              ) : (
                <li
                  key={row.resultId}
                  className="flex items-center gap-3 rounded-lg border border-border px-3 py-2"
                >
                  <PhotoThumbnail
                    url={row.members[0].studentPhotoUrl}
                    alt={`${row.members[0].studentName} photo`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{row.members[0].studentName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {row.programName} · {POSITION_LABELS[row.position] ?? `#${row.position}`}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums">
                    {row.points} pts
                  </span>
                </li>
              ),
            )}
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
