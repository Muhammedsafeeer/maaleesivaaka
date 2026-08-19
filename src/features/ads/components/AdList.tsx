"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { GripVertical, MoreHorizontal, Megaphone, Tv } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { EmptyState } from "@/components/tables/EmptyState";
import { AdFormDialog } from "@/features/ads/components/AdFormDialog";
import {
  reorderAdsAction,
  deleteAdAction,
  setAdTvVisibilityAction,
} from "@/features/ads/actions/ad.actions";
import { AD_SLOTS, AD_SLOT_COUNT } from "@/constants/ads";
import { cn } from "@/lib/utils";
import type { AdWithMedia } from "@/types/ad";

function AdRow({
  ad,
  slotLabel,
  isDragging,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: {
  ad: AdWithMedia;
  slotLabel: string | null;
  isDragging: boolean;
  onDragStart: () => void;
  onDragOver: (event: React.DragEvent) => void;
  onDrop: () => void;
  onDragEnd: () => void;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();
  const [isTogglingTv, startTvTransition] = useTransition();

  function handleDelete() {
    startDeleteTransition(async () => {
      const result = await deleteAdAction(ad.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Ad deleted.");
      setDeleteOpen(false);
    });
  }

  function handleToggleTv() {
    const next = !ad.show_on_tv;
    startTvTransition(async () => {
      const result = await setAdTvVisibilityAction(ad.id, next);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(next ? "Pushed to the TV slideshow." : "Removed from the TV slideshow.");
    });
  }

  return (
    <>
      <TableRow
        draggable
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onDragEnd={onDragEnd}
        className={cn(isDragging && "opacity-40")}
      >
        <TableCell className="w-10">
          <GripVertical className="size-4 cursor-grab text-muted-foreground active:cursor-grabbing" aria-hidden="true" />
        </TableCell>
        <TableCell className="w-16">
          <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
            {ad.media[0] ? (
              ad.media[0].media_type === "video" ? (
                <video src={ad.media[0].media_url} className="size-full object-cover" muted playsInline />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={ad.media[0].media_url} alt={`${ad.name} media`} className="size-full object-cover" />
              )
            ) : (
              <Megaphone className="size-4 text-muted-foreground" aria-hidden="true" />
            )}
          </div>
        </TableCell>
        <TableCell className="font-medium">{ad.name}</TableCell>
        <TableCell>
          <Badge variant="outline">
            {ad.media.length === 0
              ? "No media"
              : `${ad.media.length} ${ad.media.length === 1 ? "item" : "items"}`}
          </Badge>
        </TableCell>
        <TableCell className="text-sm text-muted-foreground">
          {ad.play_duration_seconds}s play / {ad.transition_duration_ms}ms fade
        </TableCell>
        <TableCell>
          {slotLabel ? (
            <Badge className="bg-primary/15 text-primary">{slotLabel}</Badge>
          ) : (
            <span className="text-xs text-muted-foreground">
              No slot — only the first {AD_SLOT_COUNT} ads show
            </span>
          )}
        </TableCell>
        <TableCell>
          {ad.show_on_tv ? (
            <Badge className="bg-house-blue/15 text-house-blue">
              <Tv className="size-3" data-icon="inline-start" />
              On TV
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </TableCell>
        <TableCell className="w-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8" aria-label={`Actions for ${ad.name}`}>
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setEditOpen(true)}>Edit</DropdownMenuItem>
              <DropdownMenuItem disabled={isTogglingTv} onSelect={handleToggleTv}>
                <Tv className="size-4" data-icon="inline-start" />
                {ad.show_on_tv ? "Remove from TV" : "Push to TV"}
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>

      <AdFormDialog open={editOpen} onOpenChange={setEditOpen} ad={ad} />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {ad.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This can&apos;t be undone. The ad will stop showing on the audience page
              immediately.
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

export function AdList({ ads }: { ads: AdWithMedia[] }) {
  const [order, setOrder] = useState(ads);
  const [syncedAds, setSyncedAds] = useState(ads);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Adjusting state on a prop change during render, not in an Effect — same pattern as
  // FixtureList's syncedPrograms guard: no flash of stale data, no extra render pass.
  if (ads !== syncedAds) {
    setSyncedAds(ads);
    setOrder(ads);
  }

  if (order.length === 0) {
    return (
      <EmptyState
        title="No ads yet"
        description="Add an ad to show a poster or video on the audience page."
      />
    );
  }

  function handleDrop(targetId: string) {
    const dragged = draggedId;
    setDraggedId(null);

    if (!dragged || dragged === targetId) return;

    const ids = order.map((a) => a.id);
    const fromIndex = ids.indexOf(dragged);
    const toIndex = ids.indexOf(targetId);
    if (fromIndex === -1 || toIndex === -1) return;

    const reorderedIds = [...ids];
    reorderedIds.splice(fromIndex, 1);
    reorderedIds.splice(toIndex, 0, dragged);

    const byId = new Map(order.map((a) => [a.id, a]));
    setOrder(reorderedIds.map((id) => byId.get(id)!));

    startTransition(async () => {
      const result = await reorderAdsAction(reorderedIds);
      if (result.error) {
        toast.error(result.error);
        setOrder(ads);
      }
    });
  }

  return (
    <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead />
            <TableHead />
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Timing</TableHead>
            <TableHead>Slot</TableHead>
            <TableHead>TV</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {order.map((ad, index) => (
            <AdRow
              key={ad.id}
              ad={ad}
              slotLabel={AD_SLOTS[index]?.label ?? null}
              isDragging={draggedId === ad.id}
              onDragStart={() => setDraggedId(ad.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => handleDrop(ad.id)}
              onDragEnd={() => setDraggedId(null)}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
