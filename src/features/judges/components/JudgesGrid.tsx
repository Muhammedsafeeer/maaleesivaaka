import { EmptyState } from "@/components/tables/EmptyState";
import { JudgeCard } from "@/features/judges/components/JudgeCard";
import type { Profile } from "@/types/profile";

export function JudgesGrid({ judges }: { judges: Profile[] }) {
  if (judges.length === 0) {
    return (
      <EmptyState
        title="No judges yet"
        description="Add a judge to let them sign in and score assigned programs."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {judges.map((judge, index) => (
        <JudgeCard key={judge.id} judge={judge} index={index} />
      ))}
    </div>
  );
}
