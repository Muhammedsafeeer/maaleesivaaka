import { createClient } from "@/lib/supabase/server";
import { defaultPosterFields, type PosterField } from "@/constants/poster";

export type ServiceResult<T> = { success: true; data: T } | { success: false; error: string };

export type PosterSettings = {
  backgroundUrl: string | null;
  fields: PosterField[];
};

/**
 * Singleton row (id = 1, seeded by 20260806110000_poster_settings.sql), same shape as
 * certificateSettings.service.ts's getCertificateSettings — one poster design for the
 * whole festival. Admin-only RLS (no anon policy): unlike certificate branding, the
 * poster feature is never rendered from an unauthenticated session.
 *
 * Saved fields are merged onto defaultPosterFields() by key rather than trusted as-is,
 * so a field the catalog gains after a layout was last saved still shows up (same
 * merge the Flutter app's PosterSettings.fromMap does) — keep the two in sync by hand.
 */
export async function getPosterSettings(): Promise<PosterSettings> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("poster_settings")
    .select("background_url, fields")
    .eq("id", 1)
    .single();

  if (error || !data) {
    return { backgroundUrl: null, fields: defaultPosterFields() };
  }

  const saved = (data.fields as PosterField[] | null) ?? [];
  const byKey = new Map(saved.map((f) => [f.key, f]));
  const merged = defaultPosterFields().map((f) => ({ ...f, ...(byKey.get(f.key) ?? {}) }));

  return { backgroundUrl: data.background_url, fields: merged };
}

export async function updatePosterBackground(backgroundUrl: string | null): Promise<ServiceResult<null>> {
  const supabase = await createClient();
  const { error } = await supabase.from("poster_settings").update({ background_url: backgroundUrl }).eq("id", 1);

  if (error) {
    return { success: false, error: "Could not save the background. Please try again." };
  }
  return { success: true, data: null };
}

export async function updatePosterFields(fields: PosterField[]): Promise<ServiceResult<null>> {
  const supabase = await createClient();
  const { error } = await supabase.from("poster_settings").update({ fields }).eq("id", 1);

  if (error) {
    return { success: false, error: "Could not save the poster layout. Please try again." };
  }
  return { success: true, data: null };
}
