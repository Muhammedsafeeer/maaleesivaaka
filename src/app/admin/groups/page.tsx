import type { Metadata } from "next";
import { listGroups } from "@/lib/services/group.service";
import { GroupsTable } from "@/features/groups/components/GroupsTable";
import { CreateGroupButton } from "@/features/groups/components/CreateGroupButton";

export const metadata: Metadata = {
  title: "Groups",
};

export default async function GroupsPage() {
  const groups = await listGroups();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-xl font-medium">Main groups</h1>
          <p className="text-sm text-muted-foreground">
            The houses students compete for. {groups.length}{" "}
            {groups.length === 1 ? "group" : "groups"}.
          </p>
        </div>
        <CreateGroupButton />
      </div>

      <GroupsTable groups={groups} />
    </div>
  );
}
