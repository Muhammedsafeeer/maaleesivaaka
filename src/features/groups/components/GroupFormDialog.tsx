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
import { PhotoUpload } from "@/components/forms/PhotoUpload";
import { groupSchema, type GroupInput } from "@/features/groups/validation/group.schema";
import {
  createGroupAction,
  updateGroupAction,
  updateGroupPhotoAction,
} from "@/features/groups/actions/group.actions";
import type { Group } from "@/types/group";

type GroupFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Omit to create a new group; pass an existing group to edit it. */
  group?: Group;
};

export function GroupFormDialog({ open, onOpenChange, group }: GroupFormDialogProps) {
  const isEditing = group !== undefined;
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GroupInput>({
    resolver: zodResolver(groupSchema),
    defaultValues: { name: group?.name ?? "" },
  });

  // Re-sync the form when switching which group is being edited (or back to create).
  useEffect(() => {
    reset({ name: group?.name ?? "" });
  }, [group, reset]);

  function onSubmit(values: GroupInput) {
    startTransition(async () => {
      const result = isEditing
        ? await updateGroupAction(group.id, values)
        : await createGroupAction(values);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(isEditing ? "Group updated." : "Group created.");
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit group" : "Add group"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update this main group's name."
              : "Create a new main group (house)."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="group-name">Name</Label>
            <Input
              id="group-name"
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

          {isEditing ? (
            <div className="flex flex-col gap-2">
              <Label>Photo</Label>
              <PhotoUpload
                bucket="group-photos"
                entityId={group.id}
                currentUrl={group.photo_url}
                onPersist={(url) => updateGroupPhotoAction(group.id, url)}
                alt={`${group.name} photo`}
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              You can add a photo after creating the group.
            </p>
          )}

          <DialogFooter>
            <SubmitButton isPending={isPending} pendingText="Saving…">
              {isEditing ? "Save changes" : "Create group"}
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
