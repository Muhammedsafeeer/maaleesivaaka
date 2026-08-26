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
import { PhotoThumbnail } from "@/components/tables/PhotoThumbnail";
import { unassignStudentAction } from "@/features/programs/actions/assignment.actions";
import {
  formatParticipantJudgeScores,
  type ProgramJudgeScoreBoard,
} from "@/lib/scoring/judgeScoreBoard";
import type { StudentWithGroup } from "@/types/student";

function RemoveButton({ programId, student }: { programId: string; student: StudentWithGroup }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleRemove() {
    startTransition(async () => {
      const result = await unassignStudentAction(programId, student.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Student removed from program.");
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
            <AlertDialogTitle>Remove {student.name} from this program?</AlertDialogTitle>
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

export function RosterTable({
  programId,
  students,
  judgeScoreBoard,
}: {
  programId: string;
  students: StudentWithGroup[];
  judgeScoreBoard: ProgramJudgeScoreBoard;
}) {
  if (students.length === 0) {
    return (
      <EmptyState
        title="No students assigned yet"
        description="Assign a student to build this program's roster."
      />
    );
  }

  const showScores = judgeScoreBoard.judges.length > 0;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-px">
            <span className="sr-only">Photo</span>
          </TableHead>
          <TableHead>Roll no.</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Class</TableHead>
          {showScores ? <TableHead>Judge scores</TableHead> : null}
          <TableHead className="w-px">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {students.map((student) => (
          <TableRow key={student.id}>
            <TableCell>
              <PhotoThumbnail url={student.photo_url} alt={`${student.name} photo`} />
            </TableCell>
            <TableCell className="tabular-nums">{student.roll_number}</TableCell>
            <TableCell className="font-medium">
              {student.name}
              {student.group_name ? (
                <span className="ml-1 font-normal text-muted-foreground">
                  ({student.group_name})
                </span>
              ) : null}
            </TableCell>
            <TableCell>{student.class}</TableCell>
            {showScores ? (
              <TableCell className="font-mono text-xs tabular-nums text-muted-foreground">
                {formatParticipantJudgeScores(
                  judgeScoreBoard.judges,
                  judgeScoreBoard.studentScores[student.id],
                )}
              </TableCell>
            ) : null}
            <TableCell>
              <RemoveButton programId={programId} student={student} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
