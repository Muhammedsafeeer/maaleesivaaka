"use server";

import { revalidatePath } from "next/cache";
import { updatePosterBackground, updatePosterFields } from "@/lib/services/posterSettings.service";
import { assertAdmin } from "@/lib/services/auth.service";
import type { PosterField } from "@/constants/poster";

export type PosterSettingsActionResult = { error: string } | { error?: undefined };

export async function updatePosterBackgroundAction(url: string | null): Promise<PosterSettingsActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const result = await updatePosterBackground(url);
  if (!result.success) return { error: result.error };

  revalidatePath("/admin/poster-settings");
  revalidatePath("/admin/results-poster");
  return {};
}

/**
 * Whole-list replace, same "no per-field CRUD" shape as
 * scoringCriteria.service.ts's replaceScoringCriteria — the designer always sends the
 * complete field catalog (positions + styles), not a diff.
 */
export async function updatePosterFieldsAction(fields: PosterField[]): Promise<PosterSettingsActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const result = await updatePosterFields(fields);
  if (!result.success) return { error: result.error };

  revalidatePath("/admin/poster-settings");
  revalidatePath("/admin/results-poster");
  return {};
}
