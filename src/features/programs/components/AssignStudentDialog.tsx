"use client";

import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SubmitButton } from "@/components/forms/SubmitButton";
import {
  assignStudentSchema,
  type AssignStudentInput,
} from "@/features/programs/validation/assignment.schema";
import { assignStudentAction } from "@/features/programs/actions/assignment.actions";
import type { Student } from "@/types/student";

export function AssignStudentDialog({
  programId,
  assignableStudents,
}: {
  programId: string;
  assignableStudents: Student[];
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AssignStudentInput>({
    resolver: zodResolver(assignStudentSchema),
    defaultValues: { student_id: "" },
  });

  function onSubmit(values: AssignStudentInput) {
    startTransition(async () => {
      const result = await assignStudentAction(programId, values);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Student assigned.");
      reset({ student_id: "" });
      setOpen(false);
    });
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} disabled={assignableStudents.length === 0}>
        <Plus className="size-4" data-icon="inline-start" />
        Assign student
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign a student</DialogTitle>
            <DialogDescription>
              Only students in this program&apos;s category who aren&apos;t already
              assigned are listed.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="assign-student">Student</Label>
              <Controller
                control={control}
                name="student_id"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      id="assign-student"
                      aria-invalid={errors.student_id ? true : undefined}
                    >
                      <SelectValue placeholder="Select a student" />
                    </SelectTrigger>
                    <SelectContent>
                      {assignableStudents.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.name} ({student.roll_number})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.student_id ? (
                <p role="alert" className="text-sm text-destructive">
                  {errors.student_id.message}
                </p>
              ) : null}
            </div>

            <DialogFooter>
              <SubmitButton isPending={isPending} pendingText="Assigning…">
                Assign
              </SubmitButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
