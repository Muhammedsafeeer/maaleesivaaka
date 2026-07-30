"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { EmptyState } from "@/components/tables/EmptyState";
import { unassignJudgeAction } from "@/features/programs/actions/assignment.actions";
import type { Profile } from "@/types/profile";

function RemoveButton({ programId, judge }: { programId: string; judge: Profile }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleRemove() {
    startTransition(async () => {
      const result = await unassignJudgeAction(programId, judge.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Judge removed from program.");
      setOpen(false);
    });
  }

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        Remove
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {judge.name} from this program?</AlertDialogTitle>
            <AlertDialogDescription>
              They can be assigned again later. This is blocked if they already have
              scores recorded for this program.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                handleRemove();
              }}
              disabled={isPending}
            >
              {isPending ? "Removing…" : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function JudgeRosterTable({
  programId,
  judges,
}: {
  programId: string;
  judges: Profile[];
}) {
  if (judges.length === 0) {
    return (
      <EmptyState
        title="No judges assigned yet"
        description="Assign a judge so they can score this program."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead className="w-px">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {judges.map((judge) => (
          <TableRow key={judge.id}>
            <TableCell className="font-medium">{judge.name}</TableCell>
            <TableCell>{judge.email}</TableCell>
            <TableCell>
              <RemoveButton programId={programId} judge={judge} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
