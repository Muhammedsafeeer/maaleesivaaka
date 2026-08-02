"use client";

import { useState, useTransition } from "react";
import { MoreHorizontal, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PhotoThumbnail } from "@/components/tables/PhotoThumbnail";
import { GroupFormDialog } from "@/features/groups/components/GroupFormDialog";
import { deleteGroupAction } from "@/features/groups/actions/group.actions";
import { cn } from "@/lib/utils";
import type { Group } from "@/types/group";

/** Cycled by card position so the grid of houses reads as colorful, not a wall of
 * identical grey cards — matches the house-* tokens used on the leaderboard/podium. */
const HOUSE_ACCENTS = [
  { icon: "bg-house-red/15 text-house-red", ring: "hover:ring-house-red/40" },
  { icon: "bg-house-blue/15 text-house-blue", ring: "hover:ring-house-blue/40" },
  { icon: "bg-house-green/15 text-house-green", ring: "hover:ring-house-green/40" },
  { icon: "bg-house-yellow/15 text-house-yellow", ring: "hover:ring-house-yellow/40" },
] as const;

export function GroupCard({ group, index }: { group: Group; index: number }) {
  const accent = HOUSE_ACCENTS[index % HOUSE_ACCENTS.length];
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();

  function handleDelete() {
    startDeleteTransition(async () => {
      const result = await deleteGroupAction(group.id);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Group deleted.");
      setDeleteOpen(false);
    });
  }

  return (
    <>
      <Card
        role="button"
        tabIndex={0}
        aria-label={`View or edit ${group.name}`}
        onClick={() => setEditOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setEditOpen(true);
          }
        }}
        className={cn(
          "group cursor-pointer transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-lg active:translate-y-0",
          accent.ring,
        )}
      >
        <CardContent className="relative flex flex-col items-center gap-2 pt-6 pb-4 text-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-1 right-1 size-7 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 data-[state=open]:opacity-100"
                aria-label={`Actions for ${group.name}`}
                onClick={(event) => event.stopPropagation()}
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
              <DropdownMenuItem onSelect={() => setEditOpen(true)}>Edit</DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {group.photo_url ? (
            <PhotoThumbnail
              url={group.photo_url}
              alt={`${group.name} photo`}
              className="size-16 rounded-full"
            />
          ) : (
            <span
              className={cn(
                "flex size-16 items-center justify-center rounded-full",
                accent.icon,
              )}
            >
              <UsersRound className="size-7" />
            </span>
          )}

          <p className="font-heading font-medium leading-snug">{group.name}</p>
        </CardContent>
      </Card>

      <GroupFormDialog open={editOpen} onOpenChange={setEditOpen} group={group} />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {group.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This can&apos;t be undone. Groups with students still assigned to them
              can&apos;t be deleted — reassign or remove those students first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
