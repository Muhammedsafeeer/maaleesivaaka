import { createClient } from "@/lib/supabase/server";

export type ServiceResult<T> = { success: true; data: T } | { success: false; error: string };

export type CertificateSettings = {
  signatoryName: string;
  sealUrl: string | null;
  signatureUrl: string | null;
};

const FALLBACK_SETTINGS: CertificateSettings = {
  signatoryName: "",
  sealUrl: null,
  signatureUrl: null,
};

/**
 * The singleton row (id = 1, seeded by the 20260806000000 migration) — one certificate
 * design (public/certificate.jpeg) for the whole festival, same shape as
 * scoreSettings.service.ts's getScoreSettings. Readable by anon (the migration's "anyone
 * can read" policy): the audience "Find My Result" print button
 * (StudentSearchBar/audience/page.tsx) needs the same branding an admin-printed
 * certificate gets, from an unauthenticated session.
 */
export async function getCertificateSettings(): Promise<CertificateSettings> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("certificate_settings")
    .select("signatory_name, seal_url, signature_url")
    .eq("id", 1)
    .single();

  if (error || !data) {
    return FALLBACK_SETTINGS;
  }

  return {
    signatoryName: data.signatory_name,
    sealUrl: data.seal_url,
    signatureUrl: data.signature_url,
  };
}

export async function updateSignatoryName(signatoryName: string): Promise<ServiceResult<null>> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("certificate_settings")
    .update({ signatory_name: signatoryName })
    .eq("id", 1);

  if (error) {
    return { success: false, error: "Could not save the signatory name. Please try again." };
  }

  return { success: true, data: null };
}

/**
 * Two narrow setters rather than one generic "update settings" — mirrors PhotoUpload's
 * own contract (an `onPersist(url: string | null)` callback wired per-field), since the
 * seal and signature images are each uploaded/removed independently of each other and of
 * the signatory name text field.
 */
export async function updateCertificateSeal(sealUrl: string | null): Promise<ServiceResult<null>> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("certificate_settings")
    .update({ seal_url: sealUrl })
    .eq("id", 1);

  if (error) {
    return { success: false, error: "Could not save the seal image. Please try again." };
  }

  return { success: true, data: null };
}

export async function updateCertificateSignature(
  signatureUrl: string | null,
): Promise<ServiceResult<null>> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("certificate_settings")
    .update({ signature_url: signatureUrl })
    .eq("id", 1);

  if (error) {
    return { success: false, error: "Could not save the signature image. Please try again." };
  }

  return { success: true, data: null };
}
