"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StudentFormDialog } from "@/features/students/components/StudentFormDialog";
import type { Group } from "@/types/group";

export function CreateStudentButton({ groups }: { groups: Group[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} disabled={groups.length === 0}>
        <Plus className="size-4" data-icon="inline-start" />
        Add student
      </Button>
      <StudentFormDialog open={open} onOpenChange={setOpen} groups={groups} />
    </>
  );
}
