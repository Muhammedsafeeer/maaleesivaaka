"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StudentFormDialog } from "@/features/students/components/StudentFormDialog";
import type { Group } from "@/types/group";
import type { Program } from "@/types/program";
import type { CategoryRow } from "@/types/category";

export function CreateStudentButton({
  groups,
  programs,
  categories: initialCategories,
}: {
  groups: Group[];
  programs: Program[];
  categories: CategoryRow[];
}) {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState(initialCategories);

  return (
    <>
      <Button onClick={() => setOpen(true)} disabled={groups.length === 0}>
        <Plus className="size-4" data-icon="inline-start" />
        Add student
      </Button>
      <StudentFormDialog
        open={open}
        onOpenChange={setOpen}
        groups={groups}
        programs={programs}
        categories={categories}
        onCategoriesChange={setCategories}
      />
    </>
  );
}
