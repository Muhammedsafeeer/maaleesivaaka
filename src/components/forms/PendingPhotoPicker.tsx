"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ImageIcon, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { compressImageToLimit } from "@/lib/utils/compressImage";
import { ALLOWED_PHOTO_MIME_TYPES, MAX_PHOTO_SIZE_BYTES } from "@/constants/storage";
import { cn } from "@/lib/utils";

type PendingPhotoPickerProps = {
  file: File | null;
  onChange: (file: File | null) => void;
  alt: string;
  error?: string;
};

/**
 * Required-photo picker for CREATE flows. Unlike PhotoUpload, there's no row id yet to
 * upload against — this only holds the (already-compressed) file locally and hands it
 * back via onChange; the caller uploads it itself once the create Server Action
 * returns the new row's id.
 */
export function PendingPhotoPicker({ file, onChange, alt, error }: PendingPhotoPickerProps) {
  // Derived straight from `file`, not synced via useState+Effect — the Effect below
  // exists only to revoke the URL when it's replaced or the component unmounts.
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  const [isCompressing, setIsCompressing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    event.target.value = ""; // allow re-selecting the same file later
    if (!selected) return;

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
            ref={inputRef}
            type="file"
            accept={ALLOWED_PHOTO_MIME_TYPES.join(",")}
            onChange={handleFileChange}
            className="hidden"
            aria-label={`Upload ${alt}`}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isCompressing}
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="size-3.5" data-icon="inline-start" />
              {isCompressing ? "Compressing…" : file ? "Replace photo" : "Choose photo"}
            </Button>
            {file ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
                <X className="size-3.5" data-icon="inline-start" />
                Remove
              </Button>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">
            JPEG, PNG, or WebP. Larger photos are compressed to 500 KB automatically.
          </p>
        </div>
      </div>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
