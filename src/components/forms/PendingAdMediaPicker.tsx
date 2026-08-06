"use client";

import { useEffect, useMemo, useRef } from "react";
import { ImageIcon, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ALLOWED_AD_MEDIA_MIME_TYPES, MAX_AD_MEDIA_SIZE_BYTES } from "@/constants/storage";
import { resolveAdMediaMimeType } from "@/lib/utils/adMediaType";
import { cn } from "@/lib/utils";

type PendingAdMediaPickerProps = {
  files: File[];
  onChange: (files: File[]) => void;
  error?: string;
};

/**
 * Required-media picker for the CREATE flow — same reasoning as PendingPhotoPicker:
 * there's no ad row id yet to key a Storage upload against, so this only holds files
 * locally and hands them back via onChange. The caller uploads them once the create
 * Server Action returns the new ad's id (AdFormDialog), attaching each as one of that
 * single ad's media items — one ad per sponsor, but that ad can carry several
 * photos/videos that cycle through its slot (more can be added later via
 * AdMediaGallery, the edit-flow counterpart of this component).
 *
 * No client-side compression, unlike PhotoUpload — posters are shown full-bleed on
 * /audience (compressing would visibly degrade them) and video can't be compressed in
 * the browser at all — so this only validates size/type before handing the raw files
 * back.
 */
export function PendingAdMediaPicker({ files, onChange, error }: PendingAdMediaPickerProps) {
  const previews = useMemo(
    () =>
      files.map((file) => ({
        file,
        url: URL.createObjectURL(file),
        isVideo: (resolveAdMediaMimeType(file) ?? "").startsWith("video/"),
      })),
    [files],
  );
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [previews]);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = ""; // allow re-selecting the same files later
    if (selected.length === 0) return;

    const valid = selected.filter(
      (file) => resolveAdMediaMimeType(file) !== null && file.size <= MAX_AD_MEDIA_SIZE_BYTES,
    );

    const skipped = selected.length - valid.length;
    if (skipped > 0) {
      toast.error(
        `${skipped} of ${selected.length} file${selected.length === 1 ? "" : "s"} skipped — wrong type or over 25 MB.`,
      );
    }

    onChange([...files, ...valid]);
  }

  function removeAt(index: number) {
    onChange(files.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        {previews.length === 0 ? (
          <div
            className={cn(
              "flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted",
              error ? "border-destructive" : "border-border",
            )}
          >
            <ImageIcon className="size-6 text-muted-foreground" aria-hidden="true" />
          </div>
        ) : (
          previews.map((preview, index) => (
            <div key={`${preview.file.name}-${index}`} className="relative">
              <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
                {preview.isVideo ? (
                  <video src={preview.url} className="size-full object-cover" muted playsInline />
                ) : (
                  // Local object URL preview of the not-yet-uploaded file.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview.url} alt={preview.file.name} className="size-full object-cover" />
                )}
              </div>
              <button
                type="button"
                onClick={() => removeAt(index)}
                aria-label={`Remove ${preview.file.name}`}
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
            onChange={handleFileChange}
            className="hidden"
            aria-label="Upload ad media"
          />
          <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
            <Upload className="size-3.5" data-icon="inline-start" />
            {files.length > 0 ? "Add more" : "Choose media"}
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        JPEG, PNG, WebP image or MP4/WebM video, up to 25 MB each. Select several to have
        this ad cycle through all of them.
      </p>
      {files.length > 1 ? (
        <p className="text-xs text-muted-foreground">
          {files.length} files selected — this one ad will cycle through all of them
          using the timing settings above.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
