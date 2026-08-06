import { ALLOWED_AD_MEDIA_MIME_TYPES } from "@/constants/storage";

type AllowedAdMediaMimeType = (typeof ALLOWED_AD_MEDIA_MIME_TYPES)[number];

const EXTENSION_FALLBACKS: Record<string, AllowedAdMediaMimeType> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  mp4: "video/mp4",
  webm: "video/webm",
};

/**
 * Browsers don't always report a usable File.type — some downloaded/exported images
 * (e.g. ChatGPT image downloads on Windows) come through with an empty or generic type,
 * which made every ad-media MIME check reject them even though the file itself is a
 * perfectly good PNG/JPEG. This falls back to the filename's extension so those aren't
 * silently dropped. Returns null only if neither the reported type nor the extension
 * matches an allowed ad-media type.
 */
export function resolveAdMediaMimeType(file: File): AllowedAdMediaMimeType | null {
  if (ALLOWED_AD_MEDIA_MIME_TYPES.includes(file.type as AllowedAdMediaMimeType)) {
    return file.type as AllowedAdMediaMimeType;
  }

  const extension = file.name.split(".").pop()?.toLowerCase();
  return (extension && EXTENSION_FALLBACKS[extension]) || null;
}
