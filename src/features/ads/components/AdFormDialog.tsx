"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Megaphone } from "lucide-react";
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
import { PendingAdMediaPicker } from "@/components/forms/PendingAdMediaPicker";
import { AdMediaGallery } from "@/features/ads/components/AdMediaGallery";
import { uploadAdMedia } from "@/lib/services/storage.service";
import { resolveAdMediaMimeType } from "@/lib/utils/adMediaType";
import { adSchema, type AdInput } from "@/features/ads/validation/ad.schema";
import { createAdAction, updateAdAction, addAdMediaAction } from "@/features/ads/actions/ad.actions";
import {
  DEFAULT_AD_PLAY_DURATION_SECONDS,
  DEFAULT_AD_TRANSITION_DURATION_MS,
} from "@/constants/ads";
import type { AdMediaType, AdWithMedia } from "@/types/ad";

type AdFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Omit to create a new ad; pass an existing ad to edit it. */
  ad?: AdWithMedia;
};

export function AdFormDialog({ open, onOpenChange, ad }: AdFormDialogProps) {
  const isEditingExisting = ad !== undefined;
  const [isPending, startTransition] = useTransition();
  // Held locally until the ad row exists, then each file is uploaded and attached as
  // its own media item — one ad, several photos/videos, not one ad per file. Same
  // two-step shape as GroupFormDialog's photoFile: the upload needs the row's id.
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaError, setMediaError] = useState<string | undefined>(undefined);
  const [syncedOpen, setSyncedOpen] = useState(open);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AdInput>({
    resolver: zodResolver(adSchema),
    defaultValues: {
      name: ad?.name ?? "",
      playDurationSeconds: ad?.play_duration_seconds ?? DEFAULT_AD_PLAY_DURATION_SECONDS,
      transitionDurationMs: ad?.transition_duration_ms ?? DEFAULT_AD_TRANSITION_DURATION_MS,
    },
  });

  // Clear local state whenever the dialog opens fresh — same render-time-adjustment
  // pattern as GroupFormDialog's syncedOpen guard.
  if (open !== syncedOpen) {
    setSyncedOpen(open);
    if (open) {
      setMediaFiles([]);
      setMediaError(undefined);
    }
  }

  useEffect(() => {
    if (open) {
      reset({
        name: ad?.name ?? "",
        playDurationSeconds: ad?.play_duration_seconds ?? DEFAULT_AD_PLAY_DURATION_SECONDS,
        transitionDurationMs: ad?.transition_duration_ms ?? DEFAULT_AD_TRANSITION_DURATION_MS,
      });
    }
  }, [ad, open, reset]);

  function onSubmit(values: AdInput) {
    if (!isEditingExisting && mediaFiles.length === 0) {
      setMediaError("At least one photo or video is required.");
      return;
    }

    startTransition(async () => {
      if (isEditingExisting) {
        const result = await updateAdAction(ad.id, values);
        if (result.error) {
          toast.error(result.error);
          return;
        }
        toast.success("Ad updated.");
        onOpenChange(false);
        return;
      }

      const createResult = await createAdAction(values);
      if (!createResult.ad) {
        toast.error(createResult.error);
        return;
      }

      const adId = createResult.ad.id;
      let attached = 0;
      let firstError: string | undefined;
      for (const file of mediaFiles) {
        const mimeType = resolveAdMediaMimeType(file);
        if (!mimeType) {
          firstError ??= `${file.name}: unrecognized file type`;
          continue;
        }

        const uploadResult = await uploadAdMedia(`${adId}/${crypto.randomUUID()}`, file);
        if (!uploadResult.success) {
          firstError ??= `${file.name}: ${uploadResult.error}`;
          console.error("[ads] upload failed", file.name, uploadResult.error);
          continue;
        }

        const mediaType: AdMediaType = mimeType.startsWith("video/") ? "video" : "image";
        const addResult = await addAdMediaAction(adId, { mediaType, mediaUrl: uploadResult.data });
        if (addResult.media) {
          attached += 1;
        } else {
          firstError ??= `${file.name}: ${addResult.error}`;
          console.error("[ads] attach failed", file.name, addResult.error);
        }
      }

      const failed = mediaFiles.length - attached;
      if (attached === 0) {
        toast.error(
          `Ad created, but none of the media could be attached${firstError ? ` (${firstError})` : ""}. Edit the ad to try again.`,
        );
      } else if (failed > 0) {
        toast.success(`Ad created with ${attached} of ${mediaFiles.length} media items — ${failed} failed.`);
      } else {
        toast.success("Ad created.");
      }
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Megaphone className="size-5" />
            </span>
            <div>
              <DialogTitle>{isEditingExisting ? "Edit ad" : "Add ad"}</DialogTitle>
              <DialogDescription>
                {isEditingExisting
                  ? "Update this ad's name, media, and timing."
                  : "One ad per sponsor — add one or more photos/videos and they&apos;ll cycle through its slot."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="ad-name">Name</Label>
            <Input
              id="ad-name"
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

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="ad-play-duration">Play duration (seconds)</Label>
              <Input
                id="ad-play-duration"
                type="number"
                min={1}
                max={300}
                aria-invalid={errors.playDurationSeconds ? true : undefined}
                {...register("playDurationSeconds", { valueAsNumber: true })}
              />
              {errors.playDurationSeconds ? (
                <p role="alert" className="text-sm text-destructive">
                  {errors.playDurationSeconds.message}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="ad-transition-duration">Transition (ms)</Label>
              <Input
                id="ad-transition-duration"
                type="number"
                min={0}
                max={5000}
                step={50}
                aria-invalid={errors.transitionDurationMs ? true : undefined}
                {...register("transitionDurationMs", { valueAsNumber: true })}
              />
              {errors.transitionDurationMs ? (
                <p role="alert" className="text-sm text-destructive">
                  {errors.transitionDurationMs.message}
                </p>
              ) : null}
            </div>
          </div>
          <p className="-mt-2 text-xs text-muted-foreground">
            Each photo/video shows for the play duration, then crossfades (transition) to
            the next. Video autoplays muted and loops while it&apos;s showing.
          </p>

          <div className="flex flex-col gap-2">
            <Label>Media{isEditingExisting ? "" : " (required)"}</Label>
            {isEditingExisting ? (
              <AdMediaGallery adId={ad.id} media={ad.media} adName={ad.name} />
            ) : (
              <PendingAdMediaPicker
                files={mediaFiles}
                onChange={(files) => {
                  setMediaFiles(files);
                  if (files.length > 0) setMediaError(undefined);
                }}
                error={mediaError}
              />
            )}
          </div>

          <DialogFooter>
            <SubmitButton isPending={isPending} pendingText="Saving…">
              {isEditingExisting ? "Save changes" : "Create ad"}
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
