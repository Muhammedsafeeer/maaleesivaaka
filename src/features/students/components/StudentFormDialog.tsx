"use client";

import { useEffect, useState, useTransition } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { GraduationCap } from "lucide-react";
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
import { PhotoUpload } from "@/components/forms/PhotoUpload";
import { PendingPhotoPicker } from "@/components/forms/PendingPhotoPicker";
import { MalayalamSuggestion } from "@/components/forms/MalayalamSuggestion";
import { uploadPhoto } from "@/lib/services/storage.service";
import { CATEGORIES, CLASSES, GENDERS } from "@/constants/programs";
import {
  studentSchema,
  type StudentInput,
} from "@/features/students/validation/student.schema";
import {
  createStudentAction,
  updateStudentAction,
  updateStudentPhotoAction,
} from "@/features/students/actions/student.actions";
import type { Student } from "@/types/student";
import type { Group } from "@/types/group";

type StudentFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: Group[];
  /** Omit to create a new student; pass an existing student to edit it. */
  student?: Student;
};

const emptyDefaults: StudentInput = {
  roll_number: "",
  name: "",
  malayalamName: "",
  class: "1",
  gender: "male",
  category: "kids",
  group_id: "",
};

// students.class is a plain `text` column — a row saved before the dropdown existed
// could hold anything. Falls back to "1" rather than a value the Select can't render.
function toStudentClass(value: string): StudentInput["class"] {
  return (CLASSES.some((c) => c.value === value) ? value : CLASSES[0].value) as StudentInput["class"];
}

export function StudentFormDialog({
  open,
  onOpenChange,
  groups,
  student,
}: StudentFormDialogProps) {
  const isEditingExisting = student !== undefined;
  const [isPending, startTransition] = useTransition();
  // A photo is required when creating (not when editing — an existing student can
  // keep their current photo). Held locally until the row exists, then uploaded and
  // persisted as part of the same submit.
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState<string | undefined>(undefined);
  const [syncedOpen, setSyncedOpen] = useState(open);

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

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<StudentInput>({
    resolver: zodResolver(studentSchema),
    defaultValues: student
      ? {
          roll_number: student.roll_number,
          name: student.name,
          malayalamName: student.malayalam_name ?? "",
          class: toStudentClass(student.class),
          gender: student.gender,
          category: student.category,
          group_id: student.group_id,
        }
      : emptyDefaults,
  });

  const malayalamNameValue = useWatch({ control, name: "malayalamName" });

  // `open` is in the deps, not just `student` — this dialog stays mounted between
  // opens (CreateStudentButton toggles `open` rather than remounting), so without it
  // the form only ever reset once at mount: creating student A, closing, and reopening
  // to add student B left A's values still sitting in every field.
  useEffect(() => {
    if (open) {
      reset(
        student
          ? {
              roll_number: student.roll_number,
              name: student.name,
              malayalamName: student.malayalam_name ?? "",
              class: toStudentClass(student.class),
              gender: student.gender,
              category: student.category,
              group_id: student.group_id,
            }
          : emptyDefaults,
      );
    }
  }, [student, open, reset]);

  function onSubmit(values: StudentInput) {
    if (!isEditingExisting && !photoFile) {
      setPhotoError("A photo is required.");
      return;
    }

    startTransition(async () => {
      if (isEditingExisting) {
        const result = await updateStudentAction(student.id, values);
        if (result.error) {
          toast.error(result.error);
          return;
        }
        toast.success("Student updated.");
        onOpenChange(false);
        return;
      }

      const createResult = await createStudentAction(values);
      if (!createResult.student) {
        toast.error(createResult.error);
        return;
      }

      const uploadResult = await uploadPhoto(
        "student-photos",
        createResult.student.id,
        photoFile!,
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

      toast.success("Student created.");
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-house-blue/15 text-house-blue">
              <GraduationCap className="size-5" />
            </span>
            <div>
              <DialogTitle>{isEditingExisting ? "Edit student" : "Add student"}</DialogTitle>
              <DialogDescription>
                {isEditingExisting
                  ? "Update this student's details."
                  : "Register a new student and assign them to a group."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="student-roll-number">Roll number</Label>
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
              <Label htmlFor="student-category">Category</Label>
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="student-category" aria-invalid={errors.category ? true : undefined}>
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

          <div className="flex flex-col gap-2">
            <Label>Photo{isEditingExisting ? "" : " (required)"}</Label>
            {isEditingExisting ? (
              <PhotoUpload
                bucket="student-photos"
                entityId={student.id}
                currentUrl={student.photo_url}
                onPersist={(url) => updateStudentPhotoAction(student.id, url)}
                alt={`${student.name} photo`}
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
  );
}
