"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { GripVertical, ChevronUp, ChevronDown, Plus, Trash2, Coffee } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { EmptyState } from "@/components/tables/EmptyState";
import { Badge } from "@/components/ui/badge";
import { ProgramStatusBadge } from "@/features/programs/components/ProgramStatusBadge";
import { ChangeScoreDialog } from "@/features/scoring/components/ChangeScoreDialog";
import {
  setProgramStatusAction,
  reorderUpcomingAction,
  createFixtureBreakAction,
  setBreakStatusAction,
  deleteFixtureBreakAction,
} from "@/features/programs/actions/fixture.actions";
import { publishProgramAction } from "@/features/programs/actions/result.actions";
import { CATEGORIES, PROGRAM_STATUSES, type ProgramStatus, type StageType } from "@/constants/programs";
import { cn } from "@/lib/utils";
import type { Program, FixtureBreak, FixtureBreakStatus } from "@/types/program";
import type { FixtureEntry, FixtureEntryRef } from "@/lib/services/fixture.service";

const categoryLabels = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]));

// 'published' is deliberately excluded — that transition stays behind the program
// page's "Publish results" gate (requires calculated results), not this override.
const overridableStatuses = PROGRAM_STATUSES.filter((s) => s.value !== "published");
const breakStatuses: { value: FixtureBreakStatus; label: string }[] = [
  { value: "upcoming", label: "Upcoming" },
  { value: "scoring", label: "Current" },
  { value: "completed", label: "Completed" },
];

const CURRENT_STATUSES = ["scoring"];

function entryLabel(entry: FixtureEntry): string {
  return entry.kind === "program" ? entry.program.name : entry.brk.label;
}

/** Shared reorder tap-targets (arrows + drag handle) — identical for a program row and
 * a break row, so both kinds of entry drag/move exactly the same way. */
function ReorderHandle({
  label,
  draggable,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
}: {
  label: string;
  draggable: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  if (!draggable) return <span className="size-4 shrink-0" aria-hidden />;

  return (
    <>
      {/* Native HTML5 drag-and-drop doesn't fire on touch (mouse-events-only API) —
          these buttons are the reorder path on mobile, and work fine alongside the
          drag handle on desktop too. Each button gets real padding (not just its bare
          icon) so its tap target is actually big enough to hit reliably on a phone —
          a bare size-3.5 icon with no padding is well under the ~40px a thumb needs. */}
      <div className="flex flex-col gap-1">
        <button
          type="button"
          aria-label={`Move ${label} up`}
          disabled={!canMoveUp}
          onClick={onMoveUp}
          className="p-1.5 -m-1.5 text-muted-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronUp className="size-4" />
        </button>
        <button
          type="button"
          aria-label={`Move ${label} down`}
          disabled={!canMoveDown}
          onClick={onMoveDown}
          className="p-1.5 -m-1.5 text-muted-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronDown className="size-4" />
        </button>
      </div>
      <GripVertical
        aria-label={`Drag to reorder ${label}`}
        className="hidden size-4 shrink-0 cursor-grab text-muted-foreground active:cursor-grabbing sm:block"
      />
    </>
  );
}

function FixtureRow({
  program,
  serialNumber,
  draggable,
  isDragging,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  isTied,
}: {
  program: Program;
  serialNumber: number | null;
  draggable: boolean;
  isDragging: boolean;
  onDragStart: () => void;
  onDragOver: (event: React.DragEvent) => void;
  onDrop: () => void;
  onDragEnd: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  /** Held on a competitive tie right now (listUnresolvedTies, scoped to
   * status='scoring') — flagged red here so it can't get buried in a long running
   * order, with a one-click way to fix it without leaving the Fixture page. */
  isTied: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [isPublishing, startPublish] = useTransition();

  function handleStatusChange(status: Exclude<ProgramStatus, "published">) {
    if (status === program.status) return;

    startTransition(async () => {
      const result = await setProgramStatusAction(program.id, status);
      if (result.error) {
        toast.error(result.error);
      }
    });
  }

  function handlePublish() {
    startPublish(async () => {
      const result = await publishProgramAction(program.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`${program.name} published — visible to the audience now.`);
    });
  }

  return (
    <TableRow
      draggable={draggable}
      onDragStart={draggable ? onDragStart : undefined}
      onDragOver={draggable ? onDragOver : undefined}
      onDrop={draggable ? onDrop : undefined}
      onDragEnd={draggable ? onDragEnd : undefined}
      className={cn(
        CURRENT_STATUSES.includes(program.status) && "bg-podium-gold/10 hover:bg-podium-gold/15",
        isTied && "bg-destructive/10 hover:bg-destructive/15",
        isDragging && "opacity-40",
      )}
    >
      <TableCell className="w-24 py-3">
        <div className="flex items-center gap-1">
          <ReorderHandle
            label={program.name}
            draggable={draggable}
            canMoveUp={canMoveUp}
            canMoveDown={canMoveDown}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
          />
          <span className="tabular-nums">{serialNumber ?? "—"}</span>
        </div>
      </TableCell>
      <TableCell className="font-medium">
        <Link href={`/admin/programs/${program.id}`} className="hover:underline">
          {program.name}
          <span className="ml-1 font-normal text-muted-foreground">
            ({categoryLabels[program.category]})
          </span>
        </Link>
        {isTied ? (
          <div className="mt-1 flex items-center gap-1.5">
            <Badge variant="destructive" className="text-[0.65rem]">
              Tied
            </Badge>
            <ChangeScoreDialog programId={program.id} programName={program.name} />
          </div>
        ) : null}
      </TableCell>
      <TableCell className="w-36">
        {program.status === "published" ? (
          <ProgramStatusBadge status={program.status} />
        ) : (
          <div className="flex flex-col gap-1.5">
            <Select
              value={program.status}
              onValueChange={(value) =>
                handleStatusChange(value as Exclude<ProgramStatus, "published">)
              }
              disabled={isPending}
            >
              <SelectTrigger aria-label={`Status for ${program.name}`} className="h-8 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {overridableStatuses.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {program.status === "completed" ? (
              <Button size="sm" className="h-8" onClick={handlePublish} disabled={isPublishing}>
                {isPublishing ? "Publishing…" : "Publish"}
              </Button>
            ) : null}
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}

/**
 * A "dummy row" for a break — a placeholder slot in the running order (tea break,
 * prayer break, ...) that isn't a real program: no category link, no criteria/results,
 * just a label, a status, and a delete option. Otherwise reorders exactly like a
 * program row (same ReorderHandle).
 */
function FixtureBreakRow({
  brk,
  serialNumber,
  draggable,
  isDragging,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
}: {
  brk: FixtureBreak;
  serialNumber: number | null;
  draggable: boolean;
  isDragging: boolean;
  onDragStart: () => void;
  onDragOver: (event: React.DragEvent) => void;
  onDrop: () => void;
  onDragEnd: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDelete] = useTransition();
  const status = brk.status as FixtureBreakStatus;

  function handleStatusChange(next: FixtureBreakStatus) {
    if (next === status) return;
    startTransition(async () => {
      const result = await setBreakStatusAction(brk.id, next);
      if (result.error) {
        toast.error(result.error);
      }
    });
  }

  function handleDelete() {
    startDelete(async () => {
      const result = await deleteFixtureBreakAction(brk.id);
      if (result.error) {
        toast.error(result.error);
      }
    });
  }

  return (
    <TableRow
      draggable={draggable}
      onDragStart={draggable ? onDragStart : undefined}
      onDragOver={draggable ? onDragOver : undefined}
      onDrop={draggable ? onDrop : undefined}
      onDragEnd={draggable ? onDragEnd : undefined}
      className={cn(
        "bg-muted/30",
        status === "scoring" && "bg-podium-gold/10 hover:bg-podium-gold/15",
        isDragging && "opacity-40",
      )}
    >
      <TableCell className="w-24 py-3">
        <div className="flex items-center gap-1">
          <ReorderHandle
            label={brk.label}
            draggable={draggable}
            canMoveUp={canMoveUp}
            canMoveDown={canMoveDown}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
          />
          <span className="tabular-nums">{serialNumber ?? "—"}</span>
        </div>
      </TableCell>
      <TableCell className="font-medium text-muted-foreground" colSpan={1}>
        <span className="flex items-center gap-1.5">
          <Coffee className="size-3.5 shrink-0" aria-hidden="true" />
          {brk.label}
        </span>
      </TableCell>
      <TableCell className="w-36">
        <div className="flex items-center gap-1.5">
          <Select
            value={status}
            onValueChange={(value) => handleStatusChange(value as FixtureBreakStatus)}
            disabled={isPending}
          >
            <SelectTrigger aria-label={`Status for ${brk.label}`} className="h-8 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {breakStatuses.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
            aria-label={`Remove ${brk.label}`}
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

function AddBreakForm({ stageType }: { stageType: StageType }) {
  const [label, setLabel] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleAdd() {
    startTransition(async () => {
      const result = await createFixtureBreakAction(stageType, label);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setLabel("");
      toast.success("Break added to the end of the running order.");
    });
  }

  return (
    <div className="flex items-center gap-2 border-b border-border bg-muted/30 p-2">
      <Input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Break label (e.g. Tea Break, 15 min)"
        className="h-8"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleAdd();
          }
        }}
      />
      <Button type="button" size="sm" className="h-8 shrink-0" onClick={handleAdd} disabled={isPending}>
        <Plus className="size-4" data-icon="inline-start" aria-hidden="true" />
        {isPending ? "Adding…" : "Add break"}
      </Button>
    </div>
  );
}

export function FixtureList({
  entries,
  stageType,
  tiedProgramIds,
}: {
  entries: FixtureEntry[];
  stageType: StageType;
  /** Programs currently held on a competitive tie (listUnresolvedTies) — a program not
   * on this stage simply won't match any row here, so callers can pass the
   * festival-wide set without filtering it by stage first. */
  tiedProgramIds?: Set<string>;
}) {
  const [order, setOrder] = useState(entries);
  const [syncedEntries, setSyncedEntries] = useState(entries);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  // Reordering changes the live running order of an in-progress event — staged here
  // and only applied on explicit confirmation, rather than immediately on drag/drop or
  // a button tap, so an accidental touch (easy on a phone) can't silently reshuffle the
  // fixture.
  const [pendingReorder, setPendingReorder] = useState<{
    description: string;
    reorderedUpcoming: FixtureEntryRef[];
  } | null>(null);
  const [, startTransition] = useTransition();

  // Adjusting state on a prop change during render (not in an Effect) — the pattern
  // React's docs recommend for "reset local state when a prop changes": no flash of
  // stale data, and no extra render pass. `syncedEntries` is the guard so this only
  // fires when the Server Component actually re-fetched, not on every render.
  if (entries !== syncedEntries) {
    setSyncedEntries(entries);
    setOrder(entries);
  }

  if (order.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <AddBreakForm stageType={stageType} />
        <EmptyState
          title="No programs on this stage"
          description="Programs you create with this stage type will appear here to be given a running-order number."
        />
      </div>
    );
  }

  function applyReorder(reorderedUpcoming: FixtureEntryRef[]) {
    setOrder((current) => {
      // Mirrors reorderUpcoming's own numbering exactly (fixture.service.ts): start
      // right after the highest serial number a settled entry already holds, then
      // number the new order sequentially — otherwise a swapped-in entry keeps
      // carrying its OLD serial number until the server round-trip finishes and a
      // fresh fetch overwrites this state, so the Serial column visibly wouldn't
      // match the new row order for a moment.
      const settledMax = current.reduce(
        (max, e) => (e.status === "upcoming" ? max : Math.max(max, e.serialNumber ?? 0)),
        0,
      );
      let nextSerial = settledMax + 1;

      const byId = new Map(current.map((e) => [e.id, e]));
      let cursor = 0;
      return current.map((e) => {
        if (e.status !== "upcoming") return e;
        const ref = reorderedUpcoming[cursor];
        cursor += 1;
        const next = byId.get(ref.id) ?? e;
        const serialNumber = nextSerial++;
        return next.kind === "program"
          ? { ...next, serialNumber, program: { ...next.program, serial_number: serialNumber } }
          : { ...next, serialNumber, brk: { ...next.brk, serial_number: serialNumber } };
      });
    });

    startTransition(async () => {
      const result = await reorderUpcomingAction(stageType, reorderedUpcoming);
      if (result.error) {
        toast.error(result.error);
        setOrder(entries);
      }
    });
  }

  function handleDrop(targetId: string) {
    const dragged = draggedId;
    setDraggedId(null);

    if (!dragged || dragged === targetId) return;

    const upcoming = order.filter((e) => e.status === "upcoming");
    const upcomingIds = upcoming.map((e) => e.id);
    const fromIndex = upcomingIds.indexOf(dragged);
    const toIndex = upcomingIds.indexOf(targetId);
    if (fromIndex === -1 || toIndex === -1) return;

    const reordered = [...upcoming];
    const [movedEntry] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, movedEntry);
    const reorderedUpcoming: FixtureEntryRef[] = reordered.map((e) => ({ id: e.id, kind: e.kind }));

    const draggedEntry = order.find((e) => e.id === dragged);
    const targetEntry = order.find((e) => e.id === targetId);
    setPendingReorder({
      description: `Move "${draggedEntry ? entryLabel(draggedEntry) : "This entry"}" next to "${
        targetEntry ? entryLabel(targetEntry) : "this position"
      }" in the running order?`,
      reorderedUpcoming,
    });
  }

  // Touch-friendly alternative to drag-and-drop (native HTML5 DnD never fires on
  // mobile touch browsers) — swaps the entry one slot up or down within the
  // upcoming-only order, same target shape reorderUpcomingAction already expects.
  function handleMove(id: string, direction: "up" | "down") {
    const upcoming = order.filter((e) => e.status === "upcoming");
    const upcomingIds = upcoming.map((e) => e.id);
    const fromIndex = upcomingIds.indexOf(id);
    if (fromIndex === -1) return;

    const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= upcoming.length) return;

    const reordered = [...upcoming];
    [reordered[fromIndex], reordered[toIndex]] = [reordered[toIndex], reordered[fromIndex]];
    const reorderedUpcoming: FixtureEntryRef[] = reordered.map((e) => ({ id: e.id, kind: e.kind }));

    const entry = order.find((e) => e.id === id);
    setPendingReorder({
      description: `Move "${entry ? entryLabel(entry) : "This entry"}" ${direction} in the running order?`,
      reorderedUpcoming,
    });
  }

  function confirmReorder() {
    if (!pendingReorder) return;
    applyReorder(pendingReorder.reorderedUpcoming);
    setPendingReorder(null);
  }

  return (
    <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
      <AddBreakForm stageType={stageType} />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Serial</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(() => {
            const upcomingIds = order.filter((e) => e.status === "upcoming").map((e) => e.id);

            return order.map((entry) => {
              const draggable = entry.status === "upcoming";
              const upcomingIndex = upcomingIds.indexOf(entry.id);
              const sharedProps = {
                serialNumber: entry.serialNumber,
                draggable,
                isDragging: draggedId === entry.id,
                onDragStart: () => setDraggedId(entry.id),
                onDragOver: (event: React.DragEvent) => event.preventDefault(),
                onDrop: () => handleDrop(entry.id),
                onDragEnd: () => setDraggedId(null),
                canMoveUp: draggable && upcomingIndex > 0,
                canMoveDown: draggable && upcomingIndex < upcomingIds.length - 1,
                onMoveUp: () => handleMove(entry.id, "up"),
                onMoveDown: () => handleMove(entry.id, "down"),
              };

              return entry.kind === "program" ? (
                <FixtureRow
                  key={entry.id}
                  program={entry.program}
                  isTied={tiedProgramIds?.has(entry.program.id) ?? false}
                  {...sharedProps}
                />
              ) : (
                <FixtureBreakRow key={entry.id} brk={entry.brk} {...sharedProps} />
              );
            });
          })()}
        </TableBody>
      </Table>

      <AlertDialog
        open={pendingReorder !== null}
        onOpenChange={(open) => {
          if (!open) setPendingReorder(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change the running order?</AlertDialogTitle>
            <AlertDialogDescription>{pendingReorder?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                confirmReorder();
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
