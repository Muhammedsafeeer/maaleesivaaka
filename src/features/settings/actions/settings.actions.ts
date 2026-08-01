"use server";

import { revalidatePath } from "next/cache";
import { updateScoreSettings } from "@/lib/services/scoreSettings.service";
import { assertAdmin } from "@/lib/services/auth.service";
import { scoreSettingsSchema, type ScoreSettingsInput } from "@/features/settings/validation/settings.schema";

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
