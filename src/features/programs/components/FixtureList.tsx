"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { GripVertical } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/tables/EmptyState";
import { ProgramStatusBadge } from "@/features/programs/components/ProgramStatusBadge";
import {
  setProgramStatusAction,
  reorderUpcomingAction,
} from "@/features/programs/actions/fixture.actions";
import { publishProgramAction } from "@/features/programs/actions/result.actions";
import { CATEGORIES, PROGRAM_STATUSES, type ProgramStatus, type StageType } from "@/constants/programs";
import { cn } from "@/lib/utils";
import type { Program } from "@/types/program";

const categoryLabels = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]));

// 'published' is deliberately excluded — that transition stays behind the program
// page's "Publish results" gate (requires calculated results), not this override.
const overridableStatuses = PROGRAM_STATUSES.filter((s) => s.value !== "published");

const CURRENT_STATUSES = ["scoring"];

function FixtureRow({
  program,
  draggable,
  isDragging,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: {
  program: Program;
  draggable: boolean;
  isDragging: boolean;
  onDragStart: () => void;
  onDragOver: (event: React.DragEvent) => void;
  onDrop: () => void;
  onDragEnd: () => void;
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
        isDragging && "opacity-40",
      )}
    >
      <TableCell className="w-20">
        <div className="flex items-center gap-1.5">
          {draggable ? (
            <GripVertical
              aria-label={`Drag to reorder ${program.name}`}
              className="size-4 shrink-0 cursor-grab text-muted-foreground active:cursor-grabbing"
            />
          ) : (
            <span className="size-4 shrink-0" aria-hidden />
          )}
          <span className="tabular-nums">{program.serial_number ?? "—"}</span>
        </div>
      </TableCell>
      <TableCell className="font-medium">
        <Link href={`/admin/programs/${program.id}`} className="hover:underline">
          {program.name}
        </Link>
      </TableCell>
      <TableCell>
        <Badge variant="outline">{categoryLabels[program.category]}</Badge>
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

export function FixtureList({
  programs,
  stageType,
}: {
  programs: Program[];
  stageType: StageType;
}) {
  const [order, setOrder] = useState(programs);
  const [syncedPrograms, setSyncedPrograms] = useState(programs);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Adjusting state on a prop change during render (not in an Effect) — the pattern
  // React's docs recommend for "reset local state when a prop changes": no flash of
  // stale data, and no extra render pass. `syncedPrograms` is the guard so this only
  // fires when the Server Component actually re-fetched, not on every render.
  if (programs !== syncedPrograms) {
    setSyncedPrograms(programs);
    setOrder(programs);
  }

  if (order.length === 0) {
    return (
      <EmptyState
        title="No programs on this stage"
        description="Programs you create with this stage type will appear here to be given a running-order number."
      />
    );
  }

  function handleDrop(targetId: string) {
    const dragged = draggedId;
    setDraggedId(null);

    if (!dragged || dragged === targetId) return;

    const upcomingIds = order.filter((p) => p.status === "upcoming").map((p) => p.id);
    const fromIndex = upcomingIds.indexOf(dragged);
    const toIndex = upcomingIds.indexOf(targetId);
    if (fromIndex === -1 || toIndex === -1) return;

    const reorderedUpcomingIds = [...upcomingIds];
    reorderedUpcomingIds.splice(fromIndex, 1);
    reorderedUpcomingIds.splice(toIndex, 0, dragged);

    setOrder((current) => {
      const byId = new Map(current.map((p) => [p.id, p]));
      let cursor = 0;
      return current.map((p) => {
        if (p.status !== "upcoming") return p;
        const id = reorderedUpcomingIds[cursor];
        cursor += 1;
        return byId.get(id) ?? p;
      });
    });

    startTransition(async () => {
      const result = await reorderUpcomingAction(stageType, reorderedUpcomingIds);
      if (result.error) {
        toast.error(result.error);
        setOrder(programs);
      }
    });
  }

  return (
    <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Serial</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {order.map((program) => {
            const draggable = program.status === "upcoming";
            return (
              <FixtureRow
                key={program.id}
                program={program}
                draggable={draggable}
                isDragging={draggedId === program.id}
                onDragStart={() => setDraggedId(program.id)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => handleDrop(program.id)}
                onDragEnd={() => setDraggedId(null)}
              />
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
