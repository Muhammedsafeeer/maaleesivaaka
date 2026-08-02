"use client";

import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Gavel } from "lucide-react";
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
import { editJudgeSchema } from "@/features/judges/validation/judge.schema";
import { updateJudgeAction } from "@/features/judges/actions/judge.actions";
import type { Profile } from "@/types/profile";

type EditJudgeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  judge: Profile;
};

// Client-only convenience schema combining the two fields this dialog shows. Each
// still goes to its own endpoint on submit (updateJudgeAction for name,
// PATCH /api/judges/[id] for password), and each re-validates authoritatively there —
// this only drives the form's own inline errors.
const editJudgeFormSchema = editJudgeSchema.extend({
  password: z.union([
    z.string().min(6, "Password must be at least 6 characters."),
    z.literal(""),
  ]),
});

type EditJudgeFormValues = z.infer<typeof editJudgeFormSchema>;

export function EditJudgeDialog({ open, onOpenChange, judge }: EditJudgeDialogProps) {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditJudgeFormValues>({
    resolver: zodResolver(editJudgeFormSchema),
    defaultValues: { name: judge.name, password: "" },
  });

  useEffect(() => {
    reset({ name: judge.name, password: "" });
  }, [judge, reset]);

  function onSubmit(values: EditJudgeFormValues) {
    startTransition(async () => {
      const result = await updateJudgeAction(judge.id, { name: values.name });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (values.password) {
        const response = await fetch(`/api/judges/${judge.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: values.password }),
        });
        const body = (await response.json()) as { error?: string };

        if (!response.ok) {
          toast.error(body.error ?? "Name updated, but the password could not be changed.");
          reset({ name: values.name, password: "" });
          onOpenChange(false);
          return;
        }
      }

      toast.success(values.password ? "Judge updated and password changed." : "Judge updated.");
      reset({ name: values.name, password: "" });
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-house-yellow/20 text-house-yellow">
              <Gavel className="size-5" />
            </span>
            <div>
              <DialogTitle>Edit judge</DialogTitle>
              <DialogDescription>
                Email can&apos;t be changed here — delete and recreate the account if it
                needs to change.
              </DialogDescription>
            </div>
          </div>
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

          <div className="flex flex-col gap-2">
            <Label htmlFor="judge-edit-password">New password</Label>
            <Input
              id="judge-edit-password"
              type="password"
              autoComplete="new-password"
              placeholder="Leave blank to keep the current password"
              aria-invalid={errors.password ? true : undefined}
              {...register("password")}
            />
            {errors.password ? (
              <p role="alert" className="text-sm text-destructive">
                {errors.password.message}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Leave blank to keep the current password.
              </p>
            )}
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
