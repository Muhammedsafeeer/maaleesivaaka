import type { Metadata } from "next";
import { listAssignedPrograms } from "@/lib/services/scoring.service";
import { StatCard } from "@/components/dashboard/StatCard";
import { EmptyState } from "@/components/tables/EmptyState";
import { JudgeProgramCard } from "@/features/scoring/components/JudgeProgramCard";
import { RealtimeProgramsListener } from "@/components/dashboard/RealtimeProgramsListener";
import { RealtimeProgramJudgesListener } from "@/components/dashboard/RealtimeProgramJudgesListener";

export const metadata: Metadata = {
  title: "Judge Dashboard",
};

function isComplete(totalStudents: number, scoredCount: number) {
  return totalStudents > 0 && scoredCount === totalStudents;
}

// Programs actually open for scoring right now (or already wrapped up by an admin)
// surface first, ahead of "upcoming"/"draft" ones a judge can't do anything with yet —
// otherwise they sort alphabetically alongside everything else and the one that
// actually needs attention can get buried in a long roster. "completed" here is the
// program's own admin-set status (can precede this judge finishing their own scoring —
// e.g. an admin closed it early), not this page's own Pending/Completed grouping below.
const STATUS_PRIORITY: Record<string, number> = { scoring: 0, completed: 1 };
function byStatusThenName(a: { status: string; name: string }, b: { status: string; name: string }) {
  const diff = (STATUS_PRIORITY[a.status] ?? 2) - (STATUS_PRIORITY[b.status] ?? 2);
  return diff !== 0 ? diff : a.name.localeCompare(b.name);
}

export default async function JudgeDashboardPage() {
  const programs = await listAssignedPrograms();

  const completed = programs
    .filter((p) => isComplete(p.totalStudents, p.scoredCount))
    .sort(byStatusThenName);
  const pending = programs
    .filter((p) => !isComplete(p.totalStudents, p.scoredCount))
    .sort(byStatusThenName);

  return (
    <div className="flex flex-col gap-6">
      <RealtimeProgramsListener />
      <RealtimeProgramJudgesListener />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Assigned Programs" value={programs.length} />
        <StatCard label="Pending" value={pending.length} />
        <StatCard label="Completed" value={completed.length} />
      </div>

      {programs.length === 0 ? (
        <EmptyState
          title="No programs assigned yet"
          description="An admin will assign you to programs before you can score them."
        />
      ) : (
        <>
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-medium">Pending</h2>
            {pending.length === 0 ? (
              <EmptyState title="Nothing pending" description="You're all caught up." />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pending.map((program) => (
                  <JudgeProgramCard key={program.id} program={program} />
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-medium">Completed</h2>
            {completed.length === 0 ? (
              <EmptyState
                title="Nothing completed yet"
                description="Programs you've fully scored will show up here."
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {completed.map((program) => (
                  <JudgeProgramCard key={program.id} program={program} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
