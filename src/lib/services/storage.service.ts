import { createClient } from "@/lib/supabase/client";
import {
  MAX_PHOTO_SIZE_BYTES,
  ALLOWED_PHOTO_MIME_TYPES,
  type PhotoBucket,
} from "@/constants/storage";

export type StorageResult<T> = { success: true; data: T } | { success: false; error: string };

/**
 * Runs in the BROWSER, unlike every other service in this folder — uploads go
 * directly from the client to Supabase Storage rather than through a Server Action.
 * The bytes never need to pass through the Next.js server, and storage.objects RLS
 * (Phase 9 migration) is the real authorization boundary either way: a session without
 * an admin-gated INSERT policy on the bucket is rejected regardless of which server
 * the request originated from.
 *
 * The database write that records the resulting URL on main_groups.photo_url /
 * students.photo_url still goes through the normal Server Action + service pattern —
 * this function only handles the file itself.
 */
export async function uploadPhoto(
  bucket: PhotoBucket,
  entityId: string,
  file: File,
): Promise<StorageResult<string>> {
  if (!ALLOWED_PHOTO_MIME_TYPES.includes(file.type as (typeof ALLOWED_PHOTO_MIME_TYPES)[number])) {
    return { success: false, error: "Photo must be a JPEG, PNG, or WebP image." };
  }

  if (file.size > MAX_PHOTO_SIZE_BYTES) {
    return { success: false, error: "Photo must be 500 KB or smaller." };
  }

  const supabase = createClient();

  // Fixed path per entity + upsert: true means re-uploading replaces the old photo at
  // the same key instead of accumulating orphaned files.
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(entityId, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    return { success: false, error: "Could not upload the photo. Please try again." };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(entityId);

  return { success: true, data: publicUrl };
}

export async function removePhoto(
  bucket: PhotoBucket,
  entityId: string,
): Promise<StorageResult<null>> {
  const supabase = createClient();
  const { error } = await supabase.storage.from(bucket).remove([entityId]);

  if (error) {
    return { success: false, error: "Could not remove the photo. Please try again." };
  }

  return { success: true, data: null };
}
