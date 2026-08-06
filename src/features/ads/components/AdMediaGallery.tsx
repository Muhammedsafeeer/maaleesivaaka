"use client";

import { useRef, useState, useTransition } from "react";
import { ImageIcon, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { uploadAdMedia } from "@/lib/services/storage.service";
import { addAdMediaAction, removeAdMediaAction } from "@/features/ads/actions/ad.actions";
import { ALLOWED_AD_MEDIA_MIME_TYPES } from "@/constants/storage";
import { resolveAdMediaMimeType } from "@/lib/utils/adMediaType";
import type { AdMedia, AdMediaType } from "@/types/ad";

type AdMediaGalleryProps = {
  adId: string;
  media: AdMedia[];
  adName: string;
};

/**
 * Edit-flow media manager — an ad can carry several photos/videos that cycle through
 * its slot (AdSlot), so this is a small gallery (add several at once, remove any item)
 * rather than PhotoUpload's single replace-in-place. Each add uploads immediately and
 * appends to local state, same "don't wait for a form Save button" split as PhotoUpload.
 */
export function AdMediaGallery({ adId, media: initialMedia, adName }: AdMediaGalleryProps) {
  const [media, setMedia] = useState(initialMedia);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFilesChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = ""; // allow re-selecting the same files later
    if (files.length === 0) return;

    startTransition(async () => {
      let added = 0;
      let failed = 0;
      let firstError: string | undefined;

      for (const file of files) {
        const mimeType = resolveAdMediaMimeType(file);
        if (!mimeType) {
          failed += 1;
          firstError ??= `${file.name}: unrecognized file type`;
          continue;
        }

        // Unlike a single-media entity key, each item needs its own Storage object —
        // see uploadAdMedia's doc comment (storage.service.ts).
        const storageKey = `${adId}/${crypto.randomUUID()}`;
        const uploadResult = await uploadAdMedia(storageKey, file);
        if (!uploadResult.success) {
          failed += 1;
          firstError ??= `${file.name}: ${uploadResult.error}`;
          console.error("[ads] upload failed", file.name, uploadResult.error);
          continue;
        }

        const mediaType: AdMediaType = mimeType.startsWith("video/") ? "video" : "image";
        const addResult = await addAdMediaAction(adId, { mediaType, mediaUrl: uploadResult.data });
        if (!addResult.media) {
          failed += 1;
          firstError ??= `${file.name}: ${addResult.error}`;
          console.error("[ads] attach failed", file.name, addResult.error);
          continue;
        }

        setMedia((current) => [...current, addResult.media]);
        added += 1;
      }

      if (failed > 0) {
        toast.error(
          `${failed} file${failed === 1 ? "" : "s"} failed to add${firstError ? ` (${firstError})` : ""}.${added > 0 ? ` ${added} added.` : ""}`,
        );
      } else if (added > 0) {
        toast.success(`${added} ${added === 1 ? "item" : "items"} added.`);
      }
    });
  }

  function handleRemove(item: AdMedia) {
    startTransition(async () => {
      const result = await removeAdMediaAction(item.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setMedia((current) => current.filter((m) => m.id !== item.id));
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        {media.length === 0 ? (
          <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
            <ImageIcon className="size-6 text-muted-foreground" aria-hidden="true" />
          </div>
        ) : (
          media.map((item) => (
            <div key={item.id} className="relative">
              <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
                {item.media_type === "video" ? (
                  <video src={item.media_url} className="size-full object-cover" muted playsInline />
                ) : (
                  // External Storage URL — see PhotoUpload.tsx for why this isn't next/image.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.media_url} alt={`${adName} media`} className="size-full object-cover" />
                )}
              </div>
              <button
                type="button"
                onClick={() => handleRemove(item)}
                disabled={isPending}
                aria-label="Remove this media item"
                className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
              >
                <X className="size-3" aria-hidden="true" />
              </button>
            </div>
          ))
        )}

        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ALLOWED_AD_MEDIA_MIME_TYPES.join(",")}
            onChange={handleFilesChange}
            className="hidden"
            aria-label="Add ad media"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="size-3.5" data-icon="inline-start" />
            {isPending ? "Adding…" : "Add media"}
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        JPEG, PNG, WebP image or MP4/WebM video, up to 25 MB each. Add several to cycle
        through them using the timing settings above.
      </p>
    </div>
  );
}
