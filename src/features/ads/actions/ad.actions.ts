"use server";

import { revalidatePath } from "next/cache";
import { adSchema, type AdInput } from "@/features/ads/validation/ad.schema";
import {
  createAd,
  updateAd,
  deleteAd,
  reorderAds,
  addAdMediaItem,
  removeAdMediaItem,
  setAdTvVisibility,
} from "@/lib/services/ad.service";
import { assertAdmin } from "@/lib/services/auth.service";
import type { Ad, AdMedia, AdMediaType } from "@/types/ad";

export type AdActionResult = { error: string } | { error?: undefined };

/** Unlike AdActionResult, this hands the created row back — the create dialog needs the
 * new id right away so it can upload the ad's media in place, same reason
 * createGroupAction does (GroupFormDialog). */
export type CreateAdActionResult = { error: string; ad?: undefined } | { error?: undefined; ad: Ad };

function revalidateAdPaths() {
  revalidatePath("/admin/ads");
  revalidatePath("/audience");
  revalidatePath("/tv");
}

export async function createAdAction(input: AdInput): Promise<CreateAdActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const parsed = adSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const result = await createAd(parsed.data);
  if (!result.success) return { error: result.error };

  revalidateAdPaths();
  return { ad: result.data };
}

export async function updateAdAction(id: string, input: AdInput): Promise<AdActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const parsed = adSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const result = await updateAd(id, parsed.data);
  if (!result.success) return { error: result.error };

  revalidateAdPaths();
  return {};
}

export type AddAdMediaActionResult =
  | { error: string; media?: undefined }
  | { error?: undefined; media: AdMedia };

/** Called by the media uploader right after a file finishes uploading to Storage — adds
 * it as one more item in the ad's media list (an ad can carry several photos/videos
 * that cycle through its slot, not just one). */
export async function addAdMediaAction(
  adId: string,
  media: { mediaType: AdMediaType; mediaUrl: string },
): Promise<AddAdMediaActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const result = await addAdMediaItem(adId, media);
  if (!result.success) return { error: result.error };

  revalidateAdPaths();
  return { media: result.data };
}

export async function removeAdMediaAction(mediaId: string): Promise<AdActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const result = await removeAdMediaItem(mediaId);
  if (!result.success) return { error: result.error };

  revalidateAdPaths();
  return {};
}

export async function setAdTvVisibilityAction(
  id: string,
  showOnTv: boolean,
): Promise<AdActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const result = await setAdTvVisibility(id, showOnTv);
  if (!result.success) return { error: result.error };

  revalidateAdPaths();
  return {};
}

export async function deleteAdAction(id: string): Promise<AdActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const result = await deleteAd(id);
  if (!result.success) return { error: result.error };

  revalidateAdPaths();
  return {};
}

export async function reorderAdsAction(orderedIds: string[]): Promise<AdActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const result = await reorderAds(orderedIds);
  if (!result.success) return { error: result.error };

  revalidateAdPaths();
  return {};
}
