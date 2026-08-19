"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { convertProgramToGroupAction } from "@/features/programs/actions/program.actions";

/** One-way individual -> group conversion (D-025 extension), for a program whose roster
 * was already built individually before someone decided it's actually a team event. */
export function ConvertToGroupButton({
  programId,
  disabled,
}: {
  programId: string;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleConvert() {
    startTransition(async () => {
      const result = await convertProgramToGroupAction(programId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Converted to a group program. Set each team's chest number below.");
      setOpen(false);
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        disabled={disabled}
        title={disabled ? "Can't convert after judges have started scoring this program." : undefined}
      >
        Convert to group
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Convert this program to a group program?</AlertDialogTitle>
            <AlertDialogDescription>
              Every house that already has a student assigned here gets a team entry
              with a placeholder chest number (TBD-1, TBD-2, …) — rename each one from
              the Teams panel afterwards. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                handleConvert();
              }}
              disabled={isPending}
            >
              {isPending ? "Converting…" : "Convert"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
