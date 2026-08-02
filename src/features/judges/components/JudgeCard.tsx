"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Mail } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { EditJudgeDialog } from "@/features/judges/components/EditJudgeDialog";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types/profile";

/** Cycled by card position, same idea as GroupCard's house colors — keeps the judges
 * grid from reading as a wall of identical grey cards. */
const ACCENTS = [
  { bg: "bg-house-yellow/20 text-house-yellow", ring: "hover:ring-house-yellow/40" },
  { bg: "bg-house-blue/20 text-house-blue", ring: "hover:ring-house-blue/40" },
  { bg: "bg-house-green/20 text-house-green", ring: "hover:ring-house-green/40" },
  { bg: "bg-house-red/20 text-house-red", ring: "hover:ring-house-red/40" },
] as const;

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

export function JudgeCard({ judge, index }: { judge: Profile; index: number }) {
  const accent = ACCENTS[index % ACCENTS.length];
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    startDeleteTransition(async () => {
      const response = await fetch(`/api/judges/${judge.id}`, { method: "DELETE" });
      const body = (await response.json()) as { error?: string };

      if (!response.ok) {
        toast.error(body.error ?? "Could not delete the judge. Please try again.");
        return;
      }

      toast.success("Judge deleted.");
      setDeleteOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <Card
        role="button"
        tabIndex={0}
        aria-label={`Edit ${judge.name}`}
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
        <CardContent className="relative flex items-center gap-3">
          <Avatar size="lg" className="shrink-0">
            <AvatarFallback className={cn("font-heading font-semibold", accent.bg)}>
              {initials(judge.name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex min-w-0 flex-col">
            <p className="truncate font-heading font-medium leading-snug">{judge.name}</p>
            <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
              <Mail className="size-3 shrink-0" />
              {judge.email}
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-1 right-1 size-7 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 data-[state=open]:opacity-100"
                aria-label={`Actions for ${judge.name}`}
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
        </CardContent>
      </Card>

      <EditJudgeDialog open={editOpen} onOpenChange={setEditOpen} judge={judge} />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {judge.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This can&apos;t be undone. Judges who have already submitted scores
              can&apos;t be deleted.
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
