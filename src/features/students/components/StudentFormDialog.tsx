"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { GraduationCap, Plus } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { PhotoUpload } from "@/components/forms/PhotoUpload";
import { PendingPhotoPicker } from "@/components/forms/PendingPhotoPicker";
import { MalayalamSuggestion } from "@/components/forms/MalayalamSuggestion";
import { uploadPhoto } from "@/lib/services/storage.service";
import { CLASSES, GENDERS, type StudentClass } from "@/constants/programs";
import { CategoryManagerDialog } from "@/features/students/components/CategoryManagerDialog";
import {
  createStudentSchema,
  type CreateStudentInput,
} from "@/features/students/validation/student.schema";
import {
  createStudentAction,
  updateStudentAction,
  updateStudentPhotoAction,
} from "@/features/students/actions/student.actions";
import { StudentProgramPicker } from "@/features/students/components/StudentProgramPicker";
import type { Student } from "@/types/student";
import type { Group } from "@/types/group";
import type { Program } from "@/types/program";
import type { CategoryRow } from "@/types/category";

type StudentFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: Group[];
  /** Admin-managed categories from the database. */
  categories: CategoryRow[];
  /** Callback when categories are added/edited/deleted in the manager dialog. */
  onCategoriesChange?: (categories: CategoryRow[]) => void;
  /** Programs offered so a student can be assigned on create and on edit. */
  programs?: Program[];
  /** Programs this student is already on — used to pre-check the picker when editing. */
  assignedProgramIds?: string[];
  /** Omit to create a new student; pass an existing student to edit it. */
  student?: Student;
};

const emptyDefaults: CreateStudentInput = {
  roll_number: "",
  name: "",
  malayalamName: "",
  class: "1",
  gender: "male",
  categories: [],
  group_id: "",
  program_ids: [],
};
const EMPTY_PROGRAM_IDS: string[] = [];

// students.class is a plain `text` column — a row saved before the dropdown existed
// could hold anything. Falls back to "1" rather than a value the Select can't render.
function toStudentClass(value: string): StudentClass {
  return (CLASSES.some((c) => c.value === value) ? value : CLASSES[0].value) as StudentClass;
}

function valuesFromStudent(student: Student, programIds: string[]): CreateStudentInput {
  return {
    roll_number: student.roll_number,
    name: student.name,
    malayalamName: student.malayalam_name ?? "",
    class: toStudentClass(student.class),
    gender: student.gender,
    categories: student.categories,
    group_id: student.group_id,
    program_ids: programIds,
  };
}

export function StudentFormDialog({
  open,
  onOpenChange,
  groups,
  categories,
  onCategoriesChange,
  programs = [],
  assignedProgramIds = EMPTY_PROGRAM_IDS,
  student,
}: StudentFormDialogProps) {
  const isEditingExisting = student !== undefined;
  const [isPending, startTransition] = useTransition();
  // Optional photo when creating. Held locally until the row exists, then uploaded
  // and persisted as part of the same submit if the admin picked one.
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState<string | undefined>(undefined);
  const [syncedOpen, setSyncedOpen] = useState(open);
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);

  // Clear local state whenever the dialog opens fresh — adjusted during render rather
  // than in an Effect (React docs: "adjust state when a prop changes"), same pattern as
  // FixtureList's syncedPrograms guard, to avoid an extra render pass.
  if (open !== syncedOpen) {
    setSyncedOpen(open);
    if (open) {
      setPhotoFile(null);
      setPhotoError(undefined);
    }
  }

  const studentCategoriesKey = student?.categories.join("|");
  const assignedProgramIdsKey = assignedProgramIds.join("|");
  const resetValues = useMemo(
    () => (student ? valuesFromStudent(student, assignedProgramIds) : emptyDefaults),
    [
      student?.id,
      student?.roll_number,
      student?.name,
      student?.malayalam_name,
      student?.class,
      student?.gender,
      studentCategoriesKey,
      student?.group_id,
      assignedProgramIdsKey,
    ],
  );

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<CreateStudentInput>({
    resolver: zodResolver(createStudentSchema),
    defaultValues: resetValues,
  });

  const malayalamNameValue = useWatch({ control, name: "malayalamName" });
  const selectedCategories = useWatch({ control, name: "categories" }) ?? [];
  const selectedProgramIds = useWatch({ control, name: "program_ids" }) ?? [];
  // Group programs (D-025) are excluded here — assigning to one requires a team (house)
  // to already exist for it, which this per-student flow has no way to set up. Group
  // rostering happens from the program's own page instead.
  const matchingPrograms = programs.filter(
    (program) =>
      selectedCategories.includes(program.category) &&
      program.participation_type === "individual",
  );

  // `open` is in the deps, not just `student` — this dialog stays mounted between
  // opens (CreateStudentButton toggles `open` rather than remounting), so without it
  // the form only ever reset once at mount: creating student A, closing, and reopening
  // to add student B left A's values still sitting in every field.
  useEffect(() => {
    if (open) {
      reset(resetValues);
    }
  }, [open, reset, resetValues]);

  function onSubmit(values: CreateStudentInput) {
    startTransition(async () => {
      if (isEditingExisting) {
        const result = await updateStudentAction(student.id, values);
        if (result.error) {
          toast.error(result.error);
          return;
        }
        if (result.assignmentError) {
          toast.error(`Student updated, but program assignment failed: ${result.assignmentError}`);
        } else {
          toast.success("Student updated.");
        }
        onOpenChange(false);
        return;
      }

      const createResult = await createStudentAction(values);
      if (!createResult.student) {
        toast.error(createResult.error);
        return;
      }

      if (photoFile) {
        const uploadResult = await uploadPhoto(
          "student-photos",
          createResult.student.id,
          photoFile,
        );
        if (!uploadResult.success) {
          toast.error(`Student created, but the photo failed to upload: ${uploadResult.error}`);
          onOpenChange(false);
          return;
        }

        const persistResult = await updateStudentPhotoAction(
          createResult.student.id,
          uploadResult.data,
        );
        if (persistResult.error) {
          toast.error(`Student created, but the photo failed to save: ${persistResult.error}`);
          onOpenChange(false);
          return;
        }
      }

      if (createResult.assignmentError) {
        toast.error(
          `Student created, but program assignment failed: ${createResult.assignmentError}`,
        );
      } else {
        toast.success("Student created.");
      }
      onOpenChange(false);
    });
  }

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-house-blue/15 text-house-blue">
              <GraduationCap className="size-5" />
            </span>
            <div>
              <DialogTitle>{isEditingExisting ? "Edit student" : "Add student"}</DialogTitle>
              <DialogDescription>
                {isEditingExisting
                  ? "Update this student's details and programs."
                  : "Register a new student, assign a group, and optionally add them to programs."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="student-roll-number">Chest number</Label>
              <Input
                id="student-roll-number"
                autoComplete="off"
                aria-invalid={errors.roll_number ? true : undefined}
                {...register("roll_number")}
              />
              {errors.roll_number ? (
                <p role="alert" className="text-sm text-destructive">
                  {errors.roll_number.message}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">Must be unique within the class.</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="student-class">Class</Label>
              <Controller
                control={control}
                name="class"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="student-class" aria-invalid={errors.class ? true : undefined}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CLASSES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.class ? (
                <p role="alert" className="text-sm text-destructive">
                  {errors.class.message}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="student-name">Name</Label>
            <Input
              id="student-name"
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
            <Label htmlFor="student-malayalam-name">Malayalam name</Label>
            <Input
              id="student-malayalam-name"
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
              <Label htmlFor="student-gender">Gender</Label>
              <Controller
                control={control}
                name="gender"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="student-gender" aria-invalid={errors.gender ? true : undefined}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDERS.map((g) => (
                        <SelectItem key={g.value} value={g.value}>
                          {g.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Categories</Label>
              <div className="flex gap-1.5">
                <Controller
                  control={control}
                  name="categories"
                  render={({ field }) => (
                    <div
                      className="flex max-h-32 flex-1 flex-col gap-1.5 overflow-y-auto rounded-md border border-input px-2.5 py-2"
                      aria-invalid={errors.categories ? true : undefined}
                    >
                      {categories.map((c) => {
                        const checked = field.value.includes(c.value);
                        return (
                          <label
                            key={c.value}
                            className="flex cursor-pointer items-center gap-2 text-sm"
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(value) => {
                                const next =
                                  value === true
                                    ? [...field.value, c.value]
                                    : field.value.filter((v) => v !== c.value);
                                field.onChange(next);
                                const allowed = new Set(
                                  programs
                                    .filter((program) => next.includes(program.category))
                                    .map((program) => program.id),
                                );
                                const nextProgramIds = (getValues("program_ids") ?? []).filter(
                                  (id) => allowed.has(id),
                                );
                                setValue("program_ids", nextProgramIds, { shouldValidate: true });
                              }}
                            />
                            {c.label}
                          </label>
                        );
                      })}
                    </div>
                  )}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setCategoryManagerOpen(true)}
                  aria-label="Manage categories"
                >
                  <Plus className="size-4" />
                </Button>
              </div>
              {errors.categories ? (
                <p role="alert" className="text-sm text-destructive">
                  {errors.categories.message}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="student-group">Main group</Label>
            <Controller
              control={control}
              name="group_id"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="student-group" aria-invalid={errors.group_id ? true : undefined}>
                    <SelectValue placeholder="Select a group" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.group_id ? (
              <p role="alert" className="text-sm text-destructive">
                {errors.group_id.message}
              </p>
            ) : null}
          </div>

          <StudentProgramPicker
            programs={matchingPrograms}
            selectedIds={selectedProgramIds}
            onChange={(ids) =>
              setValue("program_ids", ids, { shouldValidate: true, shouldDirty: true })
            }
            error={errors.program_ids?.message}
          />

          <div className="flex flex-col gap-2">
            <Label>Photo</Label>
            {isEditingExisting ? (
              <PhotoUpload
                bucket="student-photos"
                entityId={student.id}
                currentUrl={student.photo_url}
                onPersist={(url) => updateStudentPhotoAction(student.id, url)}
                alt={`${student.name} photo`}
                enableCamera
              />
            ) : (
              <PendingPhotoPicker
                file={photoFile}
                onChange={(file) => {
                  setPhotoFile(file);
                  if (file) setPhotoError(undefined);
                }}
                alt="New student photo"
                error={photoError}
                enableCamera
              />
            )}
          </div>

          <DialogFooter>
            <SubmitButton isPending={isPending} pendingText="Saving…">
              {isEditingExisting ? "Save changes" : "Create student"}
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <CategoryManagerDialog
      open={categoryManagerOpen}
      onOpenChange={setCategoryManagerOpen}
      categories={categories}
      onCategoriesChange={onCategoriesChange ?? (() => {})}
    />
  </>
  );
}
