"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdFormDialog } from "@/features/ads/components/AdFormDialog";

export function CreateAdButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" data-icon="inline-start" />
        Add ad
      </Button>
      <AdFormDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
