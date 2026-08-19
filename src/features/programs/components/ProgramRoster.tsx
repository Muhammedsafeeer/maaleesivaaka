import { Badge } from "@/components/ui/badge";
import { PhotoThumbnail } from "@/components/tables/PhotoThumbnail";
import { cn } from "@/lib/utils";
import type { ProgramRoster as ProgramRosterData } from "@/lib/services/fixture.service";

/**
 * Below "Now on stage" (fixture/page.tsx) — the current program's students in
 * performance order, with a live status derived from scoring progress rather than a
 * stored per-student flag (none exists): fully scored by every assigned judge = Done,
 * the first not-yet-done student = Performing now, everyone after = Upcoming. Without
 * any judges assigned there's no scoring signal at all, so every student just reads
 * Upcoming until judges are assigned.
 */
export function ProgramRoster({ roster }: { roster: ProgramRosterData }) {
  const { students, teams, totalJudges } = roster;

  // Group programs (D-025 follow-up): "performing" is tracked per team entry, not per
  // student — there's no per-student scoring signal for a group program at all.
  if (teams.length > 0) {
    const performingIndex =
      totalJudges > 0 ? teams.findIndex((t) => t.scoredJudgeCount < totalJudges) : -1;

    return (
      <ol className="flex flex-col gap-2">
        {teams.map((team, index) => {
          const isDone = totalJudges > 0 && team.scoredJudgeCount >= totalJudges;
          const isPerforming = index === performingIndex;

          return (
            <li
              key={team.id}
              className={cn(
                "flex items-center gap-3 rounded-lg border border-border px-3 py-2",
                isPerforming && "border-primary bg-secondary/50",
              )}
            >
              <span className="w-5 shrink-0 text-sm tabular-nums text-muted-foreground">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{team.groupName}</p>
                <p className="truncate text-xs text-muted-foreground tabular-nums">
                  Chest {team.chestNumber}
                </p>
              </div>
              {isPerforming ? (
                <Badge>Performing now</Badge>
              ) : isDone ? (
                <Badge variant="secondary">Done</Badge>
              ) : (
                <Badge variant="outline">Upcoming</Badge>
              )}
              {totalJudges > 0 ? (
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {team.scoredJudgeCount}/{totalJudges}
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    );
  }

  if (students.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No students are assigned to this program yet.
      </p>
    );
  }

  const performingIndex =
    totalJudges > 0 ? students.findIndex((s) => s.scoredJudgeCount < totalJudges) : -1;

  return (
    <ol className="flex flex-col gap-2">
      {students.map((student, index) => {
        const isDone = totalJudges > 0 && student.scoredJudgeCount >= totalJudges;
        const isPerforming = index === performingIndex;

        return (
          <li
            key={student.id}
            className={cn(
              "flex items-center gap-3 rounded-lg border border-border px-3 py-2",
              isPerforming && "border-primary bg-secondary/50",
            )}
          >
            <span className="w-5 shrink-0 text-sm tabular-nums text-muted-foreground">
              {index + 1}
            </span>
            <PhotoThumbnail url={student.photo_url} alt={`${student.name} photo`} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{student.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                Roll {student.roll_number}
              </p>
            </div>
            {isPerforming ? (
              <Badge>Performing now</Badge>
            ) : isDone ? (
              <Badge variant="secondary">Done</Badge>
            ) : (
              <Badge variant="outline">Upcoming</Badge>
            )}
            {totalJudges > 0 ? (
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {student.scoredJudgeCount}/{totalJudges}
              </span>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
