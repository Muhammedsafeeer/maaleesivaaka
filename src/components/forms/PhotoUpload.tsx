"use client";

import { useRef, useState, useTransition } from "react";
import { Camera, ImageIcon, Images, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CameraCaptureDialog } from "@/components/forms/CameraCaptureDialog";
import { uploadPhoto, removePhoto } from "@/lib/services/storage.service";
import { compressImageToLimit } from "@/lib/utils/compressImage";
import { ALLOWED_PHOTO_MIME_TYPES, MAX_PHOTO_SIZE_BYTES, type PhotoBucket } from "@/constants/storage";

type PhotoUploadProps = {
  bucket: PhotoBucket;
  entityId: string;
  currentUrl: string | null;
  /** Persists the new URL (or null, on remove) to the row — wired to a
   * feature-specific Server Action (e.g. updateGroupPhotoAction) by the caller, so
   * this component stays agnostic to which entity type it's attached to. */
  onPersist: (url: string | null) => Promise<{ error?: string }>;
  alt: string;
  /** When true, offers gallery (existing device photos) and live camera capture. */
  enableCamera?: boolean;
};

/**
 * Uploads immediately on file selection — independent of the surrounding form's own
 * "Save changes" button, since the photo and the other fields are saved through two
 * different paths (Storage + a dedicated photo action, vs. the main update action).
 */
export function PhotoUpload({
  bucket,
  entityId,
  currentUrl,
  onPersist,
  alt,
  enableCamera = false,
}: PhotoUploadProps) {
  const [url, setUrl] = useState(currentUrl);
  const [isCompressing, setIsCompressing] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const galleryRef = useRef<HTMLInputElement>(null);

  function persistFile(file: File) {
    setIsCompressing(true);
    compressImageToLimit(file, MAX_PHOTO_SIZE_BYTES)
      .then((compressed) => {
        setIsCompressing(false);
        startTransition(async () => {
          const uploadResult = await uploadPhoto(bucket, entityId, compressed);
          if (!uploadResult.success) {
            toast.error(uploadResult.error);
            return;
          }

          const persistResult = await onPersist(uploadResult.data);
          if (persistResult.error) {
            toast.error(persistResult.error);
            return;
          }

          setUrl(uploadResult.data);
          toast.success("Photo saved.");
        });
      })
      .catch(() => {
        setIsCompressing(false);
        toast.error("Could not process that photo. Please try a different file.");
      });
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    persistFile(file);
  }

  function handleRemove() {
    startTransition(async () => {
      const removeResult = await removePhoto(bucket, entityId);
      if (!removeResult.success) {
        toast.error(removeResult.error);
        return;
      }

      const persistResult = await onPersist(null);
      if (persistResult.error) {
        toast.error(persistResult.error);
        return;
      }

      setUrl(null);
      toast.success("Photo removed.");
    });
  }

  const busy = isPending || isCompressing;

  return (
    <div className="flex items-center gap-4">
      <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
        {url ? (
          // External Storage URLs — next/image isn't configured for remote patterns
          // yet, and this is a 64px admin-only thumbnail, not a page it'd meaningfully help.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={alt} className="size-full object-cover" />
        ) : (
          <ImageIcon className="size-6 text-muted-foreground" aria-hidden="true" />
        )}
      </div>

      <div className="flex flex-col gap-2">
        <input
          ref={galleryRef}
          type="file"
          accept={ALLOWED_PHOTO_MIME_TYPES.join(",")}
          onChange={handleFileChange}
          className="hidden"
          aria-label={`Choose ${alt} from storage`}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => galleryRef.current?.click()}
          >
            <Images className="size-3.5" data-icon="inline-start" />
            {isCompressing ? "Compressing…" : isPending ? "Saving…" : "From storage"}
          </Button>
          {enableCamera ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => setCameraOpen(true)}
            >
              <Camera className="size-3.5" data-icon="inline-start" />
              Camera
            </Button>
          ) : null}
          {url ? (
            <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={handleRemove}>
              <Trash2 className="size-3.5" data-icon="inline-start" />
              Remove
            </Button>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">
          {enableCamera
            ? "Pick an existing photo, or take one with the camera. Larger photos are compressed to 500 KB."
            : "JPEG, PNG, or WebP. Larger photos are compressed to 500 KB automatically."}
        </p>
      </div>

      {enableCamera ? (
        <CameraCaptureDialog
          open={cameraOpen}
          onOpenChange={setCameraOpen}
          onCapture={persistFile}
        />
      ) : null}
    </div>
  );
}
