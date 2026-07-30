"use client";

import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { editJudgeSchema, type EditJudgeInput } from "@/features/judges/validation/judge.schema";
import { updateJudgeAction } from "@/features/judges/actions/judge.actions";
import type { Profile } from "@/types/profile";

type EditJudgeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  judge: Profile;
};

export function EditJudgeDialog({ open, onOpenChange, judge }: EditJudgeDialogProps) {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditJudgeInput>({
    resolver: zodResolver(editJudgeSchema),
    defaultValues: { name: judge.name },
  });

  useEffect(() => {
    reset({ name: judge.name });
  }, [judge, reset]);

  function onSubmit(values: EditJudgeInput) {
    startTransition(async () => {
      const result = await updateJudgeAction(judge.id, values);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Judge updated.");
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit judge</DialogTitle>
          <DialogDescription>
            Email and password can&apos;t be changed here — delete and recreate the
            account if they need to change.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="judge-edit-name">Name</Label>
            <Input
              id="judge-edit-name"
              autoComplete="off"
              aria-invalid={errors.name ? true : undefined}
              {...register("name")}
            />
            {errors.name ? (
              <p role="alert" className="text-sm text-destructive">
                {errors.name.message}
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <SubmitButton isPending={isPending} pendingText="Saving…">
              Save changes
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
