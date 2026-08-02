/**
 * Browser-only canvas re-encode — no extra dependency needed for something this small.
 * Progressively drops JPEG quality, then downscales dimensions, until the result fits
 * `maxBytes` or the attempt budget runs out. Runs before upload (PhotoUpload.tsx) so
 * the 500 KB cap (MAX_PHOTO_SIZE_BYTES) rarely rejects an admin's photo outright.
 */
export async function compressImageToLimit(file: File, maxBytes: number): Promise<File> {
  if (file.size <= maxBytes) return file;

  const bitmap = await createImageBitmap(file);
  let width = bitmap.width;
  let height = bitmap.height;
  let quality = 0.9;
  let blob: Blob | null = null;

  for (let attempt = 0; attempt < 8; attempt++) {
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width));
    canvas.height = Math.max(1, Math.round(height));

    const ctx = canvas.getContext("2d");
    if (!ctx) break;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));

    if (blob && blob.size <= maxBytes) break;

    if (quality > 0.5) {
      quality -= 0.15;
    } else {
      width *= 0.75;
      height *= 0.75;
    }
  }

  bitmap.close();

  if (!blob || blob.size > maxBytes) {
    return file;
  }

  const compressedName = file.name.replace(/\.\w+$/, "") + ".jpg";
  return new File([blob], compressedName, { type: "image/jpeg" });
}
