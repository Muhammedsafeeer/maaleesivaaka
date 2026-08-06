/**
 * Storage constants — Phase 9.
 *
 * These values MUST mirror the bucket config in
 * supabase/migrations/20260730092236_storage_buckets.sql (and the follow-ups
 * 20260805010000_photo_buckets_500kb_limit.sql, 20260806000000_certificate_settings.sql,
 * which adds the certificate-assets bucket at the same 500 KB limit, and
 * 20260806020000_ads.sql, which adds ad-media at a 25 MB limit) exactly, same contract as
 * src/constants/programs.ts has with the database enums: the bucket enforces these as
 * the real boundary (an upload that doesn't match is rejected regardless of what the
 * client does), and the client-side copy here exists only so the UI can reject a bad
 * file immediately instead of waiting on a round trip.
 */

export const MAX_PHOTO_SIZE_BYTES = 500 * 1024; // 500 KB — PhotoUpload compresses larger files to fit

export const ALLOWED_PHOTO_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type PhotoBucket = "group-photos" | "student-photos" | "certificate-assets";

// ad-media holds both images and video, and — unlike PhotoUpload's photos — is never
// client-side compressed (posters are shown full-bleed; video can't be compressed in the
// browser at all), so this cap is the real boundary the UI checks before upload.
export const MAX_AD_MEDIA_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

export const ALLOWED_AD_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const ALLOWED_AD_VIDEO_MIME_TYPES = ["video/mp4", "video/webm"] as const;
export const ALLOWED_AD_MEDIA_MIME_TYPES = [
  ...ALLOWED_AD_IMAGE_MIME_TYPES,
  ...ALLOWED_AD_VIDEO_MIME_TYPES,
] as const;

export type AdMediaBucket = "ad-media";
