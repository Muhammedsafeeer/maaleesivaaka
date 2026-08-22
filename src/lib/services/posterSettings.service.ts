import { createClient } from "@/lib/supabase/server";
import { defaultPosterFields, type PosterField } from "@/constants/poster";
import type { Database } from "@/types/database.types";

export type ServiceResult<T> = { success: true; data: T } | { success: false; error: string };

export type PosterSettings = {
  /** Raw participant_category value (e.g. 'kids'), or null for the "Default" design —
   * used as the fallback for any category without a design of its own. */
  category: string | null;
  backgroundUrl: string | null;
  fields: PosterField[];
};

type ParticipantCategory = Database["public"]["Enums"]["participant_category"];

function mergeRow(row: { category: string | null; background_url: string | null; fields: unknown }): PosterSettings {
  const saved = (row.fields as PosterField[] | null) ?? [];
  const byKey = new Map(saved.map((f) => [f.key, f]));
  const merged = defaultPosterFields().map((f) => ({ ...f, ...(byKey.get(f.key) ?? {}) }));
  return { category: row.category, backgroundUrl: row.background_url, fields: merged };
}

/**
 * One row per category since 20260822000000_poster_settings_per_category.sql (was a
 * singleton, id=1, seeded by 20260806110000_poster_settings.sql) — same shape as
 * certificateSettings.service.ts's getCertificateSettings otherwise. Admin-only RLS
 * (no anon policy): the poster feature is never rendered from an unauthenticated
 * session.
 *
 * [category] null (the default, also what an omitted argument means) = the "Default"
 * design. Falls back to Default if the requested category has no row of its own
 * (e.g. a brand-new category added after the per-category migration) — mirrors the
 * Flutter app's PosterRepository.getSettings.
 *
 * Saved fields are merged onto defaultPosterFields() by key rather than trusted as-is,
 * so a field the catalog gains after a layout was last saved still shows up (same
 * merge the Flutter app's PosterSettings.fromMap does) — keep the two in sync by hand.
 */
export async function getPosterSettings(category: string | null = null): Promise<PosterSettings> {
  const supabase = await createClient();
  const query = supabase.from("poster_settings").select("category, background_url, fields");
  const { data, error } = await (category === null
    ? query.is("category", null)
    : query.eq("category", category as ParticipantCategory)
  ).single();

  if (error || !data) {
    if (category !== null) return getPosterSettings(null);
    return { category: null, backgroundUrl: null, fields: defaultPosterFields() };
  }

  return mergeRow(data);
}

/** Every design row — the admin designer's category picker uses this to know which
 * categories already have their own background configured. */
export async function listAllPosterSettings(): Promise<PosterSettings[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("poster_settings")
    .select("category, background_url, fields")
    .order("category", { ascending: true, nullsFirst: true });

  if (error || !data) return [];
  return data.map(mergeRow);
}

export async function updatePosterBackground(
  backgroundUrl: string | null,
  category: string | null = null,
): Promise<ServiceResult<null>> {
  const supabase = await createClient();
  const query = supabase.from("poster_settings").update({ background_url: backgroundUrl });
  const { error } = await (category === null ? query.is("category", null) : query.eq("category", category as ParticipantCategory));

  if (error) {
    return { success: false, error: "Could not save the background. Please try again." };
  }
  return { success: true, data: null };
}

export async function updatePosterFields(
  fields: PosterField[],
  category: string | null = null,
): Promise<ServiceResult<null>> {
  const supabase = await createClient();
  const query = supabase.from("poster_settings").update({ fields });
  const { error } = await (category === null ? query.is("category", null) : query.eq("category", category as ParticipantCategory));

  if (error) {
    return { success: false, error: "Could not save the poster layout. Please try again." };
  }
  return { success: true, data: null };
}
