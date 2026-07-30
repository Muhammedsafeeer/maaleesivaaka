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
import { CATEGORIES, GENDERS } from "@/constants/programs";
import {
  studentSchema,
  type StudentInput,
} from "@/features/students/validation/student.schema";
import {
  createStudentAction,
  updateStudentAction,
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
  class: "",
  gender: "male",
  category: "kids",
  group_id: "",
};

export function StudentFormDialog({
  open,
  onOpenChange,
  groups,
  student,
}: StudentFormDialogProps) {
  const isEditing = student !== undefined;
  const [isPending, startTransition] = useTransition();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StudentInput>({
    resolver: zodResolver(studentSchema),
    defaultValues: student
      ? {
          roll_number: student.roll_number,
          name: student.name,
          class: student.class,
          gender: student.gender,
          category: student.category,
          group_id: student.group_id,
        }
      : emptyDefaults,
  });

  useEffect(() => {
    reset(
      student
        ? {
            roll_number: student.roll_number,
            name: student.name,
            class: student.class,
            gender: student.gender,
            category: student.category,
            group_id: student.group_id,
          }
        : emptyDefaults,
    );
  }, [student, reset]);

  function onSubmit(values: StudentInput) {
    startTransition(async () => {
      const result = isEditing
        ? await updateStudentAction(student.id, values)
        : await createStudentAction(values);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(isEditing ? "Student updated." : "Student created.");
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit student" : "Add student"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update this student's details."
              : "Register a new student and assign them to a group."}
          </DialogDescription>
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
              ) : null}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="student-class">Class</Label>
              <Input
                id="student-class"
                autoComplete="off"
                aria-invalid={errors.class ? true : undefined}
                {...register("class")}
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

          <DialogFooter>
            <SubmitButton isPending={isPending} pendingText="Saving…">
              {isEditing ? "Save changes" : "Create student"}
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
