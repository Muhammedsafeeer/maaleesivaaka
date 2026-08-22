"use server";

import { revalidatePath } from "next/cache";
import {
  updatePosterBackground,
  updatePosterFields,
  applyPosterFieldsToCategories,
  getPosterSettings,
  type PosterSettings,
} from "@/lib/services/posterSettings.service";
import { assertAdmin } from "@/lib/services/auth.service";
import type { PosterField } from "@/constants/poster";

export type PosterSettingsActionResult = { error: string } | { error?: undefined };

/** Client-callable fetch for the category tab switcher — avoids a full page
 * navigation just to load a different category's design. */
export async function getPosterSettingsAction(category: string | null): Promise<PosterSettings> {
  return getPosterSettings(category);
}

export async function updatePosterBackgroundAction(
  url: string | null,
  category: string | null,
): Promise<PosterSettingsActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const result = await updatePosterBackground(url, category);
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
export async function updatePosterFieldsAction(
  fields: PosterField[],
  category: string | null,
): Promise<PosterSettingsActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const result = await updatePosterFields(fields, category);
  if (!result.success) return { error: result.error };

  revalidatePath("/admin/poster-settings");
  revalidatePath("/admin/results-poster");
  return {};
}

/** Applies one category's current field placement onto every other category — see
 * applyPosterFieldsToCategories for why this is field-only (background stays untouched). */
export async function applyPosterFieldsToAllCategoriesAction(
  fields: PosterField[],
  categories: string[],
): Promise<PosterSettingsActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const result = await applyPosterFieldsToCategories(fields, categories);
  if (!result.success) return { error: result.error };

  revalidatePath("/admin/poster-settings");
  revalidatePath("/admin/results-poster");
  return {};
}
