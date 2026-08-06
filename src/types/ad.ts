import type { Database } from "@/types/database.types";

// ad_media.media_type is `text` with a check constraint (not a real Postgres enum —
// see 20260806060000_ad_media_gallery.sql's history), same reasoning as the original
// ads.media_type drift this replaced.
export type AdMediaType = "image" | "video";

export type Ad = Database["public"]["Tables"]["ads"]["Row"];

export type AdMedia = Omit<Database["public"]["Tables"]["ad_media"]["Row"], "media_type"> & {
  media_type: AdMediaType;
};

/** An ad with its media items, ordered by position — what listAds() returns and what
 * every ad-rendering component (AdSlot, AdList's rows) actually works with. */
export type AdWithMedia = Ad & { media: AdMedia[] };
