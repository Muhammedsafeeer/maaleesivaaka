"use client";

import { useEffect, useState, useTransition } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { Badge } from "@/components/ui/badge";
import { CATEGORIES, STAGE_TYPES, PROGRAM_STATUSES } from "@/constants/programs";
import {
  programSchema,
  type ProgramInput,
} from "@/features/programs/validation/program.schema";
import {
  createProgramAction,
  updateProgramAction,
  getScoringCriteriaAction,
} from "@/features/programs/actions/program.actions";
import type { Program } from "@/types/program";

const statusLabels = Object.fromEntries(PROGRAM_STATUSES.map((s) => [s.value, s.label]));

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
  criteriaNames: [],
};

export function ProgramFormDialog({ open, onOpenChange, program }: ProgramFormDialogProps) {
  const isEditing = program !== undefined;
  const [isPending, startTransition] = useTransition();
  // Scoring types lock once any judge has scored this program — checked server-side
  // (getScoringCriteriaAction), not derived from status, since an admin can revert a
  // program's status without that meaning no scores exist. Defaults to locked while
  // editing (safe default until the real check resolves) and unlocked for a new program.
  const [criteriaLocked, setCriteriaLocked] = useState(isEditing);

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
          criteriaNames: [],
        }
      : emptyDefaults,
  });

  const { fields, append, remove } = useFieldArray({ control, name: "criteriaNames" });

  useEffect(() => {
    reset(
      program
        ? {
            name: program.name,
            stage_type: program.stage_type,
            category: program.category,
            criteriaNames: [],
          }
        : emptyDefaults,
    );

    // The dialog only has the program's own row, not its scoring types (or whether
    // they're locked) — fetched separately (and lazily, only while open) so the
    // admin's programs list doesn't pay for an extra query per row just in case its
    // dialog gets opened. `criteriaLocked` starts out matching isEditing (see its
    // useState default above) and is only corrected once this resolves — each dialog
    // instance is scoped to one program (ProgramRowActions/CreateProgramButton), so
    // `isEditing` itself never changes within an instance's lifetime.
    if (program && open) {
      getScoringCriteriaAction(program.id).then(({ data, locked }) => {
        setCriteriaLocked(locked);
        reset({
          name: program.name,
          stage_type: program.stage_type,
          category: program.category,
          criteriaNames: data.map((c) => ({ name: c.name })),
        });
      });
    }
  }, [program, open, reset]);

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

          <div className="flex flex-col gap-2">
            <Label>Scoring types</Label>
            {!criteriaLocked ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Each type is judged 0–10; the total is their sum. Leave empty to score
                  out of 10 with no breakdown.
                </p>
                <div className="flex flex-col gap-2">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2">
                      <Input
                        autoComplete="off"
                        placeholder="e.g. Voice"
                        aria-invalid={errors.criteriaNames?.[index]?.name ? true : undefined}
                        {...register(`criteriaNames.${index}.name`)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Remove scoring type"
                        onClick={() => remove(index)}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                {errors.criteriaNames?.message ? (
                  <p role="alert" className="text-sm text-destructive">
                    {errors.criteriaNames.message}
                  </p>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="self-start"
                  onClick={() => append({ name: "" })}
                >
                  <Plus className="size-4" />
                  Add scoring type
                </Button>
              </>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  {fields.length > 0 ? (
                    fields.map((field) => (
                      <Badge key={field.id} variant="outline">
                        {field.name}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="outline">Score out of 10</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Locked — judges have already submitted scores for this program.
                </p>
              </>
            )}
          </div>

          {isEditing && program ? (
            <div className="flex flex-col gap-2">
              <Label>Status</Label>
              <div>
                <Badge variant={program.status === "published" ? "default" : "secondary"}>
                  {statusLabels[program.status]}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Managed automatically by the fixture and scoring workflow — assign a serial
                number on the Fixture page to schedule it.
              </p>
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
