import { createClient } from "@/lib/supabase/client";
import {
  MAX_PHOTO_SIZE_BYTES,
  ALLOWED_PHOTO_MIME_TYPES,
  MAX_AD_MEDIA_SIZE_BYTES,
  MAX_POSTER_BACKGROUND_SIZE_BYTES,
  type PhotoBucket,
} from "@/constants/storage";
import { resolveAdMediaMimeType } from "@/lib/utils/adMediaType";

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

/**
 * Ad media isn't compressed client-side like PhotoUpload's photos — posters are shown
 * full-bleed and video can't be compressed in the browser at all — so
 * MAX_AD_MEDIA_SIZE_BYTES is the only client-side check before the upload hits the
 * bucket's own (real) limit.
 *
 * An ad can carry several media items (ad_media, one row per item), so unlike
 * uploadPhoto's fixed per-entity key, `storageKey` must be unique per item — callers
 * pass `${adId}/${crypto.randomUUID()}` so every item gets its own object under the
 * ad's "folder" instead of overwriting a single per-ad file.
 */
export async function uploadAdMedia(
  storageKey: string,
  file: File,
): Promise<StorageResult<string>> {
  // Falls back to the filename's extension when the browser reports no usable
  // File.type (see adMediaType.ts) — and that resolved type, not the possibly-empty
  // file.type, is what gets sent as contentType below, since the ad-media bucket's own
  // allowed_mime_types check (20260806020000_ads.sql) would otherwise reject the upload
  // even after this validation passes.
  const mimeType = resolveAdMediaMimeType(file);
  if (!mimeType) {
    return { success: false, error: "Ad media must be a JPEG, PNG, WebP image, or MP4/WebM video." };
  }

  if (file.size > MAX_AD_MEDIA_SIZE_BYTES) {
    return { success: false, error: "Ad media must be 25 MB or smaller." };
  }

  const supabase = createClient();

  const { error: uploadError } = await supabase.storage
    .from("ad-media")
    .upload(storageKey, file, { upsert: true, contentType: mimeType });

  if (uploadError) {
    console.error("[storage] ad-media upload error", uploadError);
    return { success: false, error: "Could not upload the ad media. Please try again." };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("ad-media").getPublicUrl(storageKey);

  return { success: true, data: publicUrl };
}

/**
 * Poster designer background — fixed key ('background', same singleton shape as
 * certificate-assets' 'seal'/'signature'), uncompressed like uploadAdMedia (shown
 * full-bleed, not a small thumbnail like PhotoUpload's photos). A `?v=` cache-buster
 * is appended to the returned URL so re-uploading over the same key doesn't keep
 * serving a cached copy of the old background — same reasoning as the Flutter app's
 * PosterRepository.uploadBackground.
 */
export async function uploadPosterBackground(file: File): Promise<StorageResult<string>> {
  if (!ALLOWED_PHOTO_MIME_TYPES.includes(file.type as (typeof ALLOWED_PHOTO_MIME_TYPES)[number])) {
    return { success: false, error: "Background must be a JPEG, PNG, or WebP image." };
  }

  if (file.size > MAX_POSTER_BACKGROUND_SIZE_BYTES) {
    return { success: false, error: "Background must be 5 MB or smaller." };
  }

  const supabase = createClient();
  const key = "background";

  const { error: uploadError } = await supabase.storage
    .from("poster-assets")
    .upload(key, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    return { success: false, error: "Could not upload the background. Please try again." };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("poster-assets").getPublicUrl(key);

  return { success: true, data: `${publicUrl}?v=${Date.now()}` };
}
