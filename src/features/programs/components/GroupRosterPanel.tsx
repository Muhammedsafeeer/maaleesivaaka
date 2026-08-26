"use client";

import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Plus, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/tables/EmptyState";
import { PhotoThumbnail } from "@/components/tables/PhotoThumbnail";
import { SubmitButton } from "@/components/forms/SubmitButton";
import {
  formatParticipantJudgeScores,
  type ProgramJudgeScoreBoard,
} from "@/lib/scoring/judgeScoreBoard";
import {
  createGroupEntrySchema,
  groupEntryChestNumberSchema,
  type CreateGroupEntryInput,
  type GroupEntryChestNumberInput,
} from "@/features/programs/validation/groupEntry.schema";
import {
  createGroupEntryAction,
  updateGroupEntryChestNumberAction,
  deleteGroupEntryAction,
  assignStudentsToGroupEntryAction,
} from "@/features/programs/actions/groupEntry.actions";
import { unassignStudentAction } from "@/features/programs/actions/assignment.actions";
import type { Group } from "@/types/group";
import type { AssignedGroupMember } from "@/lib/services/assignment.service";
import type { Student } from "@/types/student";
import type { ProgramGroupEntryWithGroup } from "@/types/programGroupEntry";

function CreateGroupEntryDialog({ programId, groups }: { programId: string; groups: Group[] }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateGroupEntryInput>({
    resolver: zodResolver(createGroupEntrySchema),
    defaultValues: { group_id: "" },
  });

  function onSubmit(values: CreateGroupEntryInput) {
    startTransition(async () => {
      const result = await createGroupEntryAction(programId, values);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Team added.");
      reset({ group_id: "" });
      setOpen(false);
    });
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} disabled={groups.length === 0}>
        <Plus className="size-4" data-icon="inline-start" />
        Add team
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a team</DialogTitle>
            <DialogDescription>
              Pick a house. A house can have more than one team here — each becomes its
              own numbered set, scored independently. The chest number is generated
              automatically (house + category initials + set number) — rename it
              afterwards if you need to.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="group-entry-house">House</Label>
              <Controller
                control={control}
                name="group_id"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      id="group-entry-house"
                      aria-invalid={errors.group_id ? true : undefined}
                    >
                      <SelectValue placeholder="Select a house" />
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
              <SubmitButton isPending={isPending} pendingText="Adding…">
                Add team
              </SubmitButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function RenameChestNumberDialog({
  programId,
  entry,
  open,
  onOpenChange,
}: {
  programId: string;
  entry: ProgramGroupEntryWithGroup;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GroupEntryChestNumberInput>({
    resolver: zodResolver(groupEntryChestNumberSchema),
    defaultValues: { chest_number: entry.chest_number },
  });

  function onSubmit(values: GroupEntryChestNumberInput) {
    startTransition(async () => {
      const result = await updateGroupEntryChestNumberAction(programId, entry.id, values);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Chest number updated.");
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename chest number</DialogTitle>
          <DialogDescription>
            {entry.group_name ?? "This team"}&apos;s shared chest number for this program.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="group-entry-rename-chest-number">Chest number</Label>
            <Input
              id="group-entry-rename-chest-number"
              autoComplete="off"
              aria-invalid={errors.chest_number ? true : undefined}
              {...register("chest_number")}
            />
            {errors.chest_number ? (
              <p role="alert" className="text-sm text-destructive">
                {errors.chest_number.message}
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <SubmitButton isPending={isPending} pendingText="Saving…">
              Save
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddTeamMemberDialog({
  programId,
  entry,
  assignableStudents,
  remainingSlots,
  open,
  onOpenChange,
}: {
  programId: string;
  entry: ProgramGroupEntryWithGroup;
  assignableStudents: Student[];
  /** Admin-set max_team_size minus this team's current member count, or null for no
   * limit — caps how many more can be ticked here before hitting the limit. */
  remainingSlots: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [error, setError] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState("");
  const atLimit = remainingSlots !== null && selectedIds.length >= remainingSlots;

  const query = search.trim().toLowerCase();
  const filteredStudents = query
    ? assignableStudents.filter(
        (s) => s.name.toLowerCase().includes(query) || s.roll_number.toLowerCase().includes(query),
      )
    : assignableStudents;

  function toggle(studentId: string, checked: boolean) {
    setSelectedIds((prev) =>
      checked ? [...prev, studentId] : prev.filter((id) => id !== studentId),
    );
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setSelectedIds([]);
      setError(undefined);
      setSearch("");
    }
    onOpenChange(nextOpen);
  }

  function onSubmit() {
    if (selectedIds.length === 0) {
      setError("Select at least one student.");
      return;
    }
    setError(undefined);
    startTransition(async () => {
      const result = await assignStudentsToGroupEntryAction(programId, {
        group_entry_id: entry.id,
        student_ids: selectedIds,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(
        selectedIds.length === 1 ? "Student added to the team." : "Students added to the team.",
      );
      setSelectedIds([]);
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add students to {entry.group_name ?? "this team"}</DialogTitle>
          <DialogDescription>
            Only students from this house who match the program&apos;s category and
            aren&apos;t already assigned are listed.{" "}
            {remainingSlots !== null
              ? `This team allows at most ${remainingSlots} more, based on its max team size.`
              : "Tick as many as you need."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Label>Students</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or roll number…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 text-sm"
              aria-label="Search students"
            />
          </div>
          <div className="max-h-64 overflow-y-auto rounded-lg border border-border">
            {filteredStudents.length === 0 ? (
              <p className="px-3 py-3 text-center text-sm text-muted-foreground">
                No students match &ldquo;{search}&rdquo;
              </p>
            ) : (
              filteredStudents.map((student) => {
                const checked = selectedIds.includes(student.id);
                return (
                  <label
                    key={student.id}
                    className="flex cursor-pointer items-center gap-2 px-3 py-2 hover:bg-muted/60 has-disabled:cursor-not-allowed has-disabled:opacity-50"
                  >
                    <Checkbox
                      checked={checked}
                      disabled={!checked && atLimit}
                      onCheckedChange={(value) => toggle(student.id, value === true)}
                    />
                    <span className="min-w-0 flex-1 truncate">
                      {student.name} ({student.roll_number})
                    </span>
                  </label>
                );
              })
            )}
          </div>
          {selectedIds.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              {selectedIds.length} {selectedIds.length === 1 ? "student" : "students"} selected
              {atLimit ? " — team limit reached" : ""}
            </p>
          ) : null}
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <SubmitButton type="button" isPending={isPending} pendingText="Adding…" onClick={onSubmit}>
            Add
          </SubmitButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RemoveMemberButton({ programId, student }: { programId: string; student: Student }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleRemove() {
    startTransition(async () => {
      const result = await unassignStudentAction(programId, student.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Student removed from the team.");
      setOpen(false);
    });
  }

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        Remove
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {student.name} from this team?</AlertDialogTitle>
            <AlertDialogDescription>
              They can be added again later. This is blocked if they already have scores
              recorded for this program.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                handleRemove();
              }}
              disabled={isPending}
            >
              {isPending ? "Removing…" : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function DeleteTeamMenuItem({ programId, entry }: { programId: string; entry: ProgramGroupEntryWithGroup }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteGroupEntryAction(programId, entry.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Team deleted.");
      setOpen(false);
    });
  }

  return (
    <>
      <DropdownMenuItem
        variant="destructive"
        onSelect={(event) => {
          event.preventDefault();
          setOpen(true);
        }}
      >
        Delete team
      </DropdownMenuItem>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this team?</AlertDialogTitle>
            <AlertDialogDescription>
              Only possible while it has no students assigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                handleDelete();
              }}
              disabled={isPending}
            >
              {isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function TeamCard({
  programId,
  entry,
  members,
  assignableStudents,
  maxTeamSize,
  judgeScoreBoard,
}: {
  programId: string;
  entry: ProgramGroupEntryWithGroup;
  members: Student[];
  assignableStudents: Student[];
  maxTeamSize: number | null;
  judgeScoreBoard: ProgramJudgeScoreBoard;
}) {
  const [renameOpen, setRenameOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const houseAssignable = assignableStudents.filter((s) => s.group_id === entry.group_id);
  const remainingSlots = maxTeamSize !== null ? Math.max(maxTeamSize - members.length, 0) : null;
  const atCap = remainingSlots === 0;
  const judgeScores =
    judgeScoreBoard.judges.length > 0
      ? formatParticipantJudgeScores(
          judgeScoreBoard.judges,
          judgeScoreBoard.teamScores[entry.id],
        )
      : "";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle>{entry.group_name ?? "Unknown house"}</CardTitle>
            <p className="text-xs text-muted-foreground">
              Set {entry.set_number} · {members.length}
              {maxTeamSize !== null ? ` / ${maxTeamSize}` : ""}{" "}
              {members.length === 1 ? "member" : "members"}
            </p>
            {judgeScores ? (
              <p className="mt-1 font-mono text-xs tabular-nums text-muted-foreground">
                {judgeScores}
              </p>
            ) : null}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-7" aria-label="Team actions">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setRenameOpen(true)}>
                Rename chest number
              </DropdownMenuItem>
              <DeleteTeamMenuItem programId={programId} entry={entry} />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <button
          type="button"
          onClick={() => setRenameOpen(true)}
          className="flex w-fit items-center gap-1.5 text-left"
        >
          <Badge variant="secondary" className="tabular-nums">
            Chest {entry.chest_number}
          </Badge>
          <Pencil className="size-3 text-muted-foreground" />
        </button>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground">No students added yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {members.map((student) => (
              <li key={student.id} className="flex items-center gap-3">
                <PhotoThumbnail url={student.photo_url} alt={`${student.name} photo`} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{student.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    Class {student.class}
                  </span>
                </span>
                <RemoveMemberButton programId={programId} student={student} />
              </li>
            ))}
          </ul>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start"
          disabled={houseAssignable.length === 0 || atCap}
          onClick={() => setAddMemberOpen(true)}
        >
          <Plus className="size-4" data-icon="inline-start" />
          {atCap ? "Team full" : "Add student"}
        </Button>
      </CardContent>

      <RenameChestNumberDialog
        programId={programId}
        entry={entry}
        open={renameOpen}
        onOpenChange={setRenameOpen}
      />
      <AddTeamMemberDialog
        programId={programId}
        entry={entry}
        assignableStudents={houseAssignable}
        remainingSlots={remainingSlots}
        open={addMemberOpen}
        onOpenChange={setAddMemberOpen}
      />
    </Card>
  );
}

export function GroupRosterPanel({
  programId,
  entries,
  groups,
  assignedStudents,
  assignableStudents,
  maxTeamSize,
  judgeScoreBoard,
}: {
  programId: string;
  entries: ProgramGroupEntryWithGroup[];
  groups: Group[];
  assignedStudents: AssignedGroupMember[];
  assignableStudents: Student[];
  maxTeamSize: number | null;
  judgeScoreBoard: ProgramJudgeScoreBoard;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-medium">Teams</h2>
          <p className="text-sm text-muted-foreground">
            {entries.length} {entries.length === 1 ? "team" : "teams"},{" "}
            {assignedStudents.length} {assignedStudents.length === 1 ? "student" : "students"}{" "}
            total{maxTeamSize !== null ? ` (max ${maxTeamSize} per team)` : ""}.
          </p>
        </div>
        <CreateGroupEntryDialog programId={programId} groups={groups} />
      </div>

      {entries.length === 0 ? (
        <EmptyState
          title="No teams yet"
          description="Add a team — pick a house, and its chest number and set number are generated automatically. A house can have more than one team (set)."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry) => (
            <TeamCard
              key={entry.id}
              programId={programId}
              entry={entry}
              members={assignedStudents.filter((s) => s.group_entry_id === entry.id)}
              assignableStudents={assignableStudents}
              maxTeamSize={maxTeamSize}
              judgeScoreBoard={judgeScoreBoard}
            />
          ))}
        </div>
      )}
    </div>
  );
}
