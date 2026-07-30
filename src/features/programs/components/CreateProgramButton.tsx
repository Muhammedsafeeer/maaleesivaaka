"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProgramFormDialog } from "@/features/programs/components/ProgramFormDialog";

export function CreateProgramButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" data-icon="inline-start" />
        Add program
      </Button>
      <ProgramFormDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
