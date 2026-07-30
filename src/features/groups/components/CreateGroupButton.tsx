"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GroupFormDialog } from "@/features/groups/components/GroupFormDialog";

export function CreateGroupButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" data-icon="inline-start" />
        Add group
      </Button>
      <GroupFormDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
