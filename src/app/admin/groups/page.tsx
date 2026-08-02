import type { Metadata } from "next";
import { UsersRound } from "lucide-react";
import { listGroups } from "@/lib/services/group.service";
import { GroupsGrid } from "@/features/groups/components/GroupsGrid";
import { CreateGroupButton } from "@/features/groups/components/CreateGroupButton";

export const metadata: Metadata = {
  title: "Groups",
};

export default async function GroupsPage() {
  const groups = await listGroups();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-house-red/15 text-house-red">
            <UsersRound className="size-5" />
          </span>
          <div>
            <h1 className="font-heading text-xl font-medium">Main groups</h1>
            <p className="text-sm text-muted-foreground">
              The houses students compete for. {groups.length}{" "}
              {groups.length === 1 ? "group" : "groups"}.
            </p>
          </div>
        </div>
        <CreateGroupButton />
      </div>

      <GroupsGrid groups={groups} />
    </div>
  );
}
