"use client";

import { useEffect, useState, useTransition } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ListMusic, Plus, X } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { MalayalamSuggestion } from "@/components/forms/MalayalamSuggestion";
import { Badge } from "@/components/ui/badge";
import { CATEGORIES, STAGE_TYPES, PARTICIPATION_TYPES } from "@/constants/programs";
import {
  createProgramSchema,
  type CreateProgramInput,
} from "@/features/programs/validation/program.schema";
import {
  createProgramAction,
  updateProgramAction,
  getScoringCriteriaAction,
} from "@/features/programs/actions/program.actions";
import { ProgramStatusBadge } from "@/features/programs/components/ProgramStatusBadge";
import type { Program } from "@/types/program";

type ProgramFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Omit to create a new program; pass an existing program to edit it. */
  program?: Program;
};

const participationTypeLabels = Object.fromEntries(
  PARTICIPATION_TYPES.map((p) => [p.value, p.label]),
);

const emptyDefaults: CreateProgramInput = {
  name: "",
  malayalamName: "",
  stage_type: "on_stage",
  category: "kids",
  participation_type: "individual",
  criteriaNames: [],
  maxTeamSize: "",
  hideResults: false,
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
    setValue,
    formState: { errors },
  } = useForm<CreateProgramInput>({
    resolver: zodResolver(createProgramSchema),
    defaultValues: program
      ? {
          name: program.name,
          malayalamName: program.malayalam_name ?? "",
          stage_type: program.stage_type,
          category: program.category,
          participation_type: program.participation_type,
          criteriaNames: [],
          maxTeamSize: program.max_team_size ? String(program.max_team_size) : "",
          hideResults: program.hide_results,
        }
      : emptyDefaults,
  });

  const malayalamNameValue = useWatch({ control, name: "malayalamName" });
  // Only relevant while creating: editing reads participation_type straight off
  // `program` instead (it's immutable, shown read-only below), so this watch is unused
  // — but harmless — once isEditing is true.
  const selectedParticipationType = useWatch({ control, name: "participation_type" });
  const { fields, append, remove } = useFieldArray({ control, name: "criteriaNames" });
  const isGroup = program
    ? program.participation_type === "group"
    : selectedParticipationType === "group";

  useEffect(() => {
    reset(
      program
        ? {
            name: program.name,
            malayalamName: program.malayalam_name ?? "",
            stage_type: program.stage_type,
            category: program.category,
            participation_type: program.participation_type,
            criteriaNames: [],
            maxTeamSize: program.max_team_size ? String(program.max_team_size) : "",
            hideResults: program.hide_results,
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
          malayalamName: program.malayalam_name ?? "",
          stage_type: program.stage_type,
          category: program.category,
          participation_type: program.participation_type,
          criteriaNames: data.map((c) => ({ name: c.name })),
          maxTeamSize: program.max_team_size ? String(program.max_team_size) : "",
          hideResults: program.hide_results,
        });
      });
    }
  }, [program, open, reset]);

  function onSubmit(values: CreateProgramInput) {
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-podium-gold/15 text-podium-gold">
              <ListMusic className="size-5" />
            </span>
            <div>
              <DialogTitle>{isEditing ? "Edit program" : "Add program"}</DialogTitle>
              <DialogDescription>
                {isEditing
                  ? "Update this program's details."
                  : "New programs start as a draft."}
              </DialogDescription>
            </div>
          </div>
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

          <div className="flex flex-col gap-2">
            <Label htmlFor="program-malayalam-name">Malayalam name</Label>
            <Input
              id="program-malayalam-name"
              autoComplete="off"
              lang="ml"
              aria-invalid={errors.malayalamName ? true : undefined}
              {...register("malayalamName")}
            />
            <MalayalamSuggestion
              value={malayalamNameValue ?? ""}
              onAccept={(text) =>
                setValue("malayalamName", text, { shouldValidate: true, shouldDirty: true })
              }
            />
            {errors.malayalamName ? (
              <p role="alert" className="text-sm text-destructive">
                {errors.malayalamName.message}
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
            <Label htmlFor="program-participation-type">Participation</Label>
            {program ? (
              <div>
                <Badge variant="outline">
                  {participationTypeLabels[program.participation_type]}
                </Badge>
                <p className="mt-1 text-xs text-muted-foreground">
                  {program.participation_type === "individual"
                    ? "To switch this to a group program, use “Convert to group” on the program page (only before any judge has scored it)."
                    : "Set at creation and can't be changed afterwards."}
                </p>
              </div>
            ) : (
              <Controller
                control={control}
                name="participation_type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="program-participation-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PARTICIPATION_TYPES.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            )}
            <p className="text-xs text-muted-foreground">
              Group programs are team events — a house&apos;s team gets one shared chest
              number, assigned from the program page after creation.
            </p>
          </div>

          {isGroup ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="program-max-team-size">Max team size (optional)</Label>
              <Input
                id="program-max-team-size"
                type="number"
                inputMode="numeric"
                min={1}
                autoComplete="off"
                placeholder="No limit"
                aria-invalid={errors.maxTeamSize ? true : undefined}
                {...register("maxTeamSize")}
              />
              <p className="text-xs text-muted-foreground">
                Blocks adding more than this many students to one team/set. Leave blank
                for no limit. Lowering this later doesn&apos;t remove anyone already over
                the new limit — it only blocks adding more.
              </p>
              {errors.maxTeamSize ? (
                <p role="alert" className="text-sm text-destructive">
                  {errors.maxTeamSize.message}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-col gap-2">
            <Controller
              control={control}
              name="hideResults"
              render={({ field }) => (
                <label className="flex cursor-pointer items-start gap-2">
                  <Checkbox
                    id="program-hide-results"
                    checked={field.value ?? false}
                    onCheckedChange={(value) => field.onChange(value === true)}
                  />
                  <span>
                    <span className="block text-sm font-medium">
                      Hide results from the public
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      Keeps this program off audience pages, the public leaderboard
                      total, and student result search — even once published. Admin
                      and judges are unaffected.
                    </span>
                  </span>
                </label>
              )}
            />
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
                <ProgramStatusBadge status={program.status} />
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
