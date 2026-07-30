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
  assignJudgeSchema,
  type AssignJudgeInput,
} from "@/features/programs/validation/assignment.schema";
import { assignJudgeAction } from "@/features/programs/actions/assignment.actions";
import type { Profile } from "@/types/profile";

export function AssignJudgeDialog({
  programId,
  assignableJudges,
}: {
  programId: string;
  assignableJudges: Profile[];
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AssignJudgeInput>({
    resolver: zodResolver(assignJudgeSchema),
    defaultValues: { judge_id: "" },
  });

  function onSubmit(values: AssignJudgeInput) {
    startTransition(async () => {
      const result = await assignJudgeAction(programId, values);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Judge assigned.");
      reset({ judge_id: "" });
      setOpen(false);
    });
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} disabled={assignableJudges.length === 0}>
        <Plus className="size-4" data-icon="inline-start" />
        Assign judge
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign a judge</DialogTitle>
            <DialogDescription>
              Only judges who aren&apos;t already assigned to this program are listed.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="assign-judge">Judge</Label>
              <Controller
                control={control}
                name="judge_id"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      id="assign-judge"
                      aria-invalid={errors.judge_id ? true : undefined}
                    >
                      <SelectValue placeholder="Select a judge" />
                    </SelectTrigger>
                    <SelectContent>
                      {assignableJudges.map((judge) => (
                        <SelectItem key={judge.id} value={judge.id}>
                          {judge.name} ({judge.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.judge_id ? (
                <p role="alert" className="text-sm text-destructive">
                  {errors.judge_id.message}
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
