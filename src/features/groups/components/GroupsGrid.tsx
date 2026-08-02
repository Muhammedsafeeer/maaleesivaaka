import { EmptyState } from "@/components/tables/EmptyState";
import { GroupCard } from "@/features/groups/components/GroupCard";
import type { Group } from "@/types/group";

export function GroupsGrid({ groups }: { groups: Group[] }) {
  if (groups.length === 0) {
    return (
      <EmptyState
        title="No groups yet"
        description="Create a main group to get started."
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {groups.map((group, index) => (
        <GroupCard key={group.id} group={group} index={index} />
      ))}
    </div>
  );
}
