"use client";

import { useState, useTransition } from "react";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { StudentFormDialog } from "@/features/students/components/StudentFormDialog";
import { deleteStudentAction } from "@/features/students/actions/student.actions";
import { GENDERS } from "@/constants/programs";
import type { StudentWithGroup } from "@/types/student";
import type { Group } from "@/types/group";
import type { Program } from "@/types/program";
import type { CategoryRow } from "@/types/category";

const genderLabels = Object.fromEntries(GENDERS.map((g) => [g.value, g.label]));

/** Card view of a student: every field the table showed, plus a hover-lift and
 * click-anywhere-to-edit affordance in place of the row-actions-only table. */
export function StudentCard({
  student,
  groups,
  categories,
  onCategoriesChange,
  programs,
  assignedProgramIds,
}: {
  student: StudentWithGroup;
  groups: Group[];
  categories: CategoryRow[];
  onCategoriesChange: (categories: CategoryRow[]) => void;
  programs: Program[];
  assignedProgramIds: string[];
}) {
  const categoryLabels = Object.fromEntries(categories.map((c) => [c.value, c.label]));
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();

  function handleDelete() {
    startDeleteTransition(async () => {
      const result = await deleteStudentAction(student.id);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Student deleted.");
      setDeleteOpen(false);
    });
  }

  return (
    <>
      <Card
        size="sm"
        role="button"
        tabIndex={0}
        aria-label={`View or edit ${student.name}`}
        onClick={() => setEditOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setEditOpen(true);
          }
        }}
        className="group cursor-pointer transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-lg hover:ring-primary/40 active:translate-y-0"
      >
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <PhotoThumbnail
              url={student.photo_url}
              alt={`${student.name} photo`}
              className="size-14 rounded-lg"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 data-[state=open]:opacity-100"
                  aria-label={`Actions for ${student.name}`}
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
          </div>

          <div>
            <p className="font-heading font-medium leading-snug">{student.name}</p>
            <p className="text-sm text-muted-foreground tabular-nums">
              Roll {student.roll_number} · Class {student.class}
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline">{categoryLabels[student.category]}</Badge>
            <Badge variant="secondary">{genderLabels[student.gender]}</Badge>
            {student.group_name ? <Badge variant="outline">{student.group_name}</Badge> : null}
          </div>
        </CardContent>
      </Card>

      <StudentFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        groups={groups}
        categories={categories}
        onCategoriesChange={onCategoriesChange}
        programs={programs}
        assignedProgramIds={assignedProgramIds}
        student={student}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {student.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This can&apos;t be undone. Students already assigned to a program or with
              recorded scores can&apos;t be deleted.
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
