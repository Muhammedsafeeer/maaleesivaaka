"use server";

import { revalidatePath } from "next/cache";
import { updateScoreSettings } from "@/lib/services/scoreSettings.service";
import {
  updateSignatoryName,
  updateCertificateSeal,
  updateCertificateSignature,
} from "@/lib/services/certificateSettings.service";
import { assertAdmin } from "@/lib/services/auth.service";
import {
  scoreSettingsSchema,
  signatoryNameSchema,
  type ScoreSettingsInput,
  type SignatoryNameInput,
} from "@/features/settings/validation/settings.schema";

export type SettingsActionResult = { error: string } | { error?: undefined };

export async function updateScoreSettingsAction(
  input: ScoreSettingsInput,
): Promise<SettingsActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const parsed = scoreSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Enter a valid number of points for each position." };
  }

  const result = await updateScoreSettings(parsed.data);
  if (!result.success) return { error: result.error };

  revalidatePath("/admin/settings");
  return {};
}

export async function updateSignatoryNameAction(
  input: SignatoryNameInput,
): Promise<SettingsActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const parsed = signatoryNameSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Keep the signatory name under 120 characters." };
  }

  const result = await updateSignatoryName(parsed.data.signatoryName);
  if (!result.success) return { error: result.error };

  revalidatePath("/admin/settings");
  return {};
}

/**
 * Wired as PhotoUpload's onPersist — PhotoUpload already did the Storage upload itself
 * (client-side, storage.service.ts) before calling this; these two actions only record
 * the resulting URL on certificate_settings, same split every other PhotoUpload caller
 * (e.g. updateGroupPhotoAction) uses.
 */
export async function updateCertificateSealAction(url: string | null): Promise<SettingsActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const result = await updateCertificateSeal(url);
  if (!result.success) return { error: result.error };

  revalidatePath("/admin/settings");
  return {};
}

export async function updateCertificateSignatureAction(
  url: string | null,
): Promise<SettingsActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { error: auth.error };

  const result = await updateCertificateSignature(url);
  if (!result.success) return { error: result.error };

  revalidatePath("/admin/settings");
  return {};
}
