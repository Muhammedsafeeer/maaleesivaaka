import { createClient } from "@/lib/supabase/server";
import type { Ad, AdMedia, AdWithMedia } from "@/types/ad";

export type ServiceResult<T> = { success: true; data: T } | { success: false; error: string };

// ad_media.media_type is generated as `string` (it's a check-constrained text column,
// not a real Postgres enum — see types/ad.ts), so every read is narrowed here at the DB
// boundary. Safe: ad_media_type_check guarantees the live column only ever holds
// 'image' | 'video'.
function asAdMedia(row: { media_type: string } & Omit<AdMedia, "media_type">): AdMedia {
  return row as AdMedia;
}

export async function listAds(): Promise<AdWithMedia[]> {
  const supabase = await createClient();
  const [adsResult, mediaResult] = await Promise.all([
    supabase.from("ads").select("*").order("position", { ascending: true }),
    supabase.from("ad_media").select("*").order("position", { ascending: true }),
  ]);

  if (adsResult.error) {
    // Read-path failures degrade to an empty list, same convention as listGroups —
    // both /admin/ads and the audience page's slots render their empty state instead of
    // crashing the whole page over an ad.
    return [];
  }

  const mediaByAdId = new Map<string, AdMedia[]>();
  for (const row of mediaResult.data ?? []) {
    const media = asAdMedia(row);
    const existing = mediaByAdId.get(media.ad_id);
    if (existing) existing.push(media);
    else mediaByAdId.set(media.ad_id, [media]);
  }

  return adsResult.data.map((ad) => ({ ...ad, media: mediaByAdId.get(ad.id) ?? [] }));
}

export type AdInput = {
  name: string;
  playDurationSeconds: number;
  transitionDurationMs: number;
};

/** New ads land after every existing one; reordering into an actual slot is a
 * deliberate drag afterward, not something creation guesses at. */
export async function createAd(input: AdInput): Promise<ServiceResult<Ad>> {
  const supabase = await createClient();
  const { count } = await supabase.from("ads").select("*", { count: "exact", head: true });

  const { data, error } = await supabase
    .from("ads")
    .insert({
      name: input.name,
      position: (count ?? 0) + 1,
      play_duration_seconds: input.playDurationSeconds,
      transition_duration_ms: input.transitionDurationMs,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: "Could not create the ad. Please try again." };
  }

  return { success: true, data };
}

export async function updateAd(id: string, input: AdInput): Promise<ServiceResult<Ad>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ads")
    .update({
      name: input.name,
      play_duration_seconds: input.playDurationSeconds,
      transition_duration_ms: input.transitionDurationMs,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { success: false, error: "Could not update the ad. Please try again." };
  }

  return { success: true, data };
}

export async function deleteAd(id: string): Promise<ServiceResult<null>> {
  const supabase = await createClient();
  const { error } = await supabase.from("ads").delete().eq("id", id);

  if (error) {
    return { success: false, error: "Could not delete the ad. Please try again." };
  }

  return { success: true, data: null };
}

/** Persists a full drag-and-drop reorder in one go — see reorder_ads
 * (20260806020000_ads.sql) for why this has to be a single DB transaction rather than
 * one .update() per row. */
export async function reorderAds(orderedIds: string[]): Promise<ServiceResult<null>> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("reorder_ads", { p_ids: orderedIds });

  if (error) {
    return { success: false, error: "Could not save the new order. Please try again." };
  }

  return { success: true, data: null };
}

/** Called by the media uploader right after a file finishes uploading to Storage — adds
 * it as the ad's next media item (lands at the end, after any existing items). */
export async function addAdMediaItem(
  adId: string,
  media: { mediaType: "image" | "video"; mediaUrl: string },
): Promise<ServiceResult<AdMedia>> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("ad_media")
    .select("*", { count: "exact", head: true })
    .eq("ad_id", adId);

  const { data, error } = await supabase
    .from("ad_media")
    .insert({
      ad_id: adId,
      media_type: media.mediaType,
      media_url: media.mediaUrl,
      position: (count ?? 0) + 1,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: "Could not add the media. Please try again." };
  }

  return { success: true, data: asAdMedia(data) };
}

export async function removeAdMediaItem(mediaId: string): Promise<ServiceResult<null>> {
  const supabase = await createClient();
  const { error } = await supabase.from("ad_media").delete().eq("id", mediaId);

  if (error) {
    return { success: false, error: "Could not remove the media. Please try again." };
  }

  return { success: true, data: null };
}
