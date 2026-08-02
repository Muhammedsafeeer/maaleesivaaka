"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { UsersRound } from "lucide-react";
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
import { PendingPhotoPicker } from "@/components/forms/PendingPhotoPicker";
import { uploadPhoto } from "@/lib/services/storage.service";
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
  const isEditingExisting = group !== undefined;
  const [isPending, startTransition] = useTransition();
  // A photo is required when creating (not when editing — an existing group can keep
  // its current photo). Held locally until the row exists, then uploaded and
  // persisted as part of the same submit.
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState<string | undefined>(undefined);
  const [syncedOpen, setSyncedOpen] = useState(open);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GroupInput>({
    resolver: zodResolver(groupSchema),
    defaultValues: { name: group?.name ?? "" },
  });

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

  // Re-sync the form whenever the dialog opens — whether switching which group is
  // being edited, or reopening a fresh "create" dialog after a previous session.
  useEffect(() => {
    if (open) {
      reset({ name: group?.name ?? "" });
    }
  }, [group, open, reset]);

  function onSubmit(values: GroupInput) {
    if (!isEditingExisting && !photoFile) {
      setPhotoError("A photo is required.");
      return;
    }

    startTransition(async () => {
      if (isEditingExisting) {
        const result = await updateGroupAction(group.id, values);
        if (result.error) {
          toast.error(result.error);
          return;
        }
        toast.success("Group updated.");
        onOpenChange(false);
        return;
      }

      const createResult = await createGroupAction(values);
      if (!createResult.group) {
        toast.error(createResult.error);
        return;
      }

      const uploadResult = await uploadPhoto("group-photos", createResult.group.id, photoFile!);
      if (!uploadResult.success) {
        toast.error(`Group created, but the photo failed to upload: ${uploadResult.error}`);
        onOpenChange(false);
        return;
      }

      const persistResult = await updateGroupPhotoAction(createResult.group.id, uploadResult.data);
      if (persistResult.error) {
        toast.error(`Group created, but the photo failed to save: ${persistResult.error}`);
        onOpenChange(false);
        return;
      }

      toast.success("Group created.");
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-house-blue/15 text-house-blue">
              <UsersRound className="size-5" />
            </span>
            <div>
              <DialogTitle>{isEditingExisting ? "Edit group" : "Add group"}</DialogTitle>
              <DialogDescription>
                {isEditingExisting
                  ? "Update this main group's name and photo."
                  : "Create a new main group (house) that students compete for."}
              </DialogDescription>
            </div>
          </div>
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

          <div className="flex flex-col gap-2">
            <Label>Photo{isEditingExisting ? "" : " (required)"}</Label>
            {isEditingExisting ? (
              <PhotoUpload
                bucket="group-photos"
                entityId={group.id}
                currentUrl={group.photo_url}
                onPersist={(url) => updateGroupPhotoAction(group.id, url)}
                alt={`${group.name} photo`}
              />
            ) : (
              <PendingPhotoPicker
                file={photoFile}
                onChange={(file) => {
                  setPhotoFile(file);
                  if (file) setPhotoError(undefined);
                }}
                alt="New group photo"
                error={photoError}
              />
            )}
          </div>

          <DialogFooter>
            <SubmitButton isPending={isPending} pendingText="Saving…">
              {isEditingExisting ? "Save changes" : "Create group"}
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
