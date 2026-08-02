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
import { Button } from "@/components/ui/button";
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
  const isEditingExisting = group !== undefined;
  const [isPending, startTransition] = useTransition();
  // A brand-new group unlocks its photo step in place, right after creation —
  // no need to close the dialog and reopen it in edit mode just to attach a photo.
  const [justCreated, setJustCreated] = useState<Group | null>(null);
  const [syncedOpen, setSyncedOpen] = useState(open);
  const activeGroup = group ?? justCreated ?? undefined;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GroupInput>({
    resolver: zodResolver(groupSchema),
    defaultValues: { name: group?.name ?? "" },
  });

  // Clear the "just created" step whenever the dialog opens fresh — adjusted during
  // render rather than in an Effect (React docs: "adjust state when a prop changes"),
  // same pattern as FixtureList's syncedPrograms guard, to avoid an extra render pass.
  if (open !== syncedOpen) {
    setSyncedOpen(open);
    if (open) {
      setJustCreated(null);
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

      const result = await createGroupAction(values);
      if (!result.group) {
        toast.error(result.error);
        return;
      }

      toast.success("Group created.");
      setJustCreated(result.group);
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
              <DialogTitle>
                {isEditingExisting ? "Edit group" : justCreated ? "Add a photo" : "Add group"}
              </DialogTitle>
              <DialogDescription>
                {isEditingExisting
                  ? "Update this main group's name and photo."
                  : justCreated
                    ? `"${justCreated.name}" is created. Give it a photo now, or add one later.`
                    : "Create a new main group (house) that students compete for."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          {!justCreated ? (
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
          ) : null}

          {activeGroup ? (
            <div className="flex flex-col gap-2">
              <Label>Photo</Label>
              <PhotoUpload
                bucket="group-photos"
                entityId={activeGroup.id}
                currentUrl={activeGroup.photo_url}
                onPersist={(url) => updateGroupPhotoAction(activeGroup.id, url)}
                alt={`${activeGroup.name} photo`}
              />
            </div>
          ) : null}

          <DialogFooter>
            {justCreated ? (
              <Button type="button" onClick={() => onOpenChange(false)}>
                Done
              </Button>
            ) : (
              <SubmitButton isPending={isPending} pendingText="Saving…">
                {isEditingExisting ? "Save changes" : "Create group"}
              </SubmitButton>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
