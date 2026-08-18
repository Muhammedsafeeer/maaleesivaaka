"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, ImageIcon, Images, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CameraCaptureDialog } from "@/components/forms/CameraCaptureDialog";
import { compressImageToLimit } from "@/lib/utils/compressImage";
import { ALLOWED_PHOTO_MIME_TYPES, MAX_PHOTO_SIZE_BYTES } from "@/constants/storage";
import { cn } from "@/lib/utils";

type PendingPhotoPickerProps = {
  file: File | null;
  onChange: (file: File | null) => void;
  alt: string;
  error?: string;
  /** When true, offers gallery (existing device photos) and live camera capture. */
  enableCamera?: boolean;
};

/**
 * Photo picker for CREATE flows. Unlike PhotoUpload, there's no row id yet to
 * upload against — this only holds the (already-compressed) file locally and hands it
 * back via onChange; the caller uploads it itself once the create Server Action
 * returns the new row's id. The photo is optional.
 */
export function PendingPhotoPicker({
  file,
  onChange,
  alt,
  error,
  enableCamera = false,
}: PendingPhotoPickerProps) {
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  const [isCompressing, setIsCompressing] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const galleryRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function applyFile(selected: File) {
    setIsCompressing(true);
    compressImageToLimit(selected, MAX_PHOTO_SIZE_BYTES)
      .then((compressed) => {
        setIsCompressing(false);
        onChange(compressed);
      })
      .catch(() => {
        setIsCompressing(false);
        toast.error("Could not process that photo. Please try a different file.");
      });
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    event.target.value = "";
    if (!selected) return;
    applyFile(selected);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted",
            error ? "border-destructive" : "border-border",
          )}
        >
          {previewUrl ? (
            // Local object URL preview of the not-yet-uploaded file.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt={alt} className="size-full object-cover" />
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
              disabled={isCompressing}
              onClick={() => galleryRef.current?.click()}
            >
              <Images className="size-3.5" data-icon="inline-start" />
              {isCompressing ? "Compressing…" : "From storage"}
            </Button>
            {enableCamera ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isCompressing}
                onClick={() => setCameraOpen(true)}
              >
                <Camera className="size-3.5" data-icon="inline-start" />
                Camera
              </Button>
            ) : null}
            {file ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
                <X className="size-3.5" data-icon="inline-start" />
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
      </div>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {enableCamera ? (
        <CameraCaptureDialog
          open={cameraOpen}
          onOpenChange={setCameraOpen}
          onCapture={applyFile}
        />
      ) : null}
    </div>
  );
}
