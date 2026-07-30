"use client";

import { useEffect, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { CATEGORIES, STAGE_TYPES, PROGRAM_STATUSES } from "@/constants/programs";
import {
  programSchema,
  type ProgramInput,
} from "@/features/programs/validation/program.schema";
import {
  createProgramAction,
  updateProgramAction,
} from "@/features/programs/actions/program.actions";
import type { Program } from "@/types/program";

type ProgramFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Omit to create a new program; pass an existing program to edit it. */
  program?: Program;
};

const emptyDefaults: ProgramInput = {
  name: "",
  stage_type: "on_stage",
  category: "kids",
  status: "draft",
};

export function ProgramFormDialog({ open, onOpenChange, program }: ProgramFormDialogProps) {
  const isEditing = program !== undefined;
  const [isPending, startTransition] = useTransition();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProgramInput>({
    resolver: zodResolver(programSchema),
    defaultValues: program
      ? {
          name: program.name,
          stage_type: program.stage_type,
          category: program.category,
          status: program.status,
        }
      : emptyDefaults,
  });

  useEffect(() => {
    reset(
      program
        ? {
            name: program.name,
            stage_type: program.stage_type,
            category: program.category,
            status: program.status,
          }
        : emptyDefaults,
    );
  }, [program, reset]);

  function onSubmit(values: ProgramInput) {
    startTransition(async () => {
      const result = isEditing
        ? await updateProgramAction(program.id, values)
        : await createProgramAction(values);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(isEditing ? "Program updated." : "Program created.");
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit program" : "Add program"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update this program's details."
              : "New programs start as a draft."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="program-name">Name</Label>
            <Input
              id="program-name"
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

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="program-stage-type">Stage type</Label>
              <Controller
                control={control}
                name="stage_type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="program-stage-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STAGE_TYPES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="program-category">Category</Label>
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="program-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {isEditing ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="program-status">Status</Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="program-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROGRAM_STATUSES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          ) : null}

          <DialogFooter>
            <SubmitButton isPending={isPending} pendingText="Saving…">
              {isEditing ? "Save changes" : "Create program"}
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
