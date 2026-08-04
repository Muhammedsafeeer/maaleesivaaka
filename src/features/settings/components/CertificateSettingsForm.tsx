"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { PhotoUpload } from "@/components/forms/PhotoUpload";
import {
  signatoryNameSchema,
  type SignatoryNameInput,
} from "@/features/settings/validation/settings.schema";
import {
  updateSignatoryNameAction,
  updateCertificateSealAction,
  updateCertificateSignatureAction,
} from "@/features/settings/actions/settings.actions";
import type { CertificateSettings } from "@/lib/services/certificateSettings.service";

/**
 * Configures the branding CertificateTemplate (src/features/certificates) stamps onto
 * every printed certificate: the seal and signature images sit in fixed spots on
 * public/certificate.jpeg, and the signatory name prints under the signature. Seal and
 * signature each use PhotoUpload against the 'certificate-assets' bucket with a fixed
 * entity key ('seal' / 'signature') rather than a per-row id — there's only ever one of
 * each for the whole festival, same singleton shape as certificate_settings itself.
 */
export function CertificateSettingsForm({ settings }: { settings: CertificateSettings }) {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignatoryNameInput>({
    resolver: zodResolver(signatoryNameSchema),
    defaultValues: { signatoryName: settings.signatoryName },
  });

  function onSubmit(values: SignatoryNameInput) {
    startTransition(async () => {
      const result = await updateSignatoryNameAction(values);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Signatory name saved.");
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <div className="flex max-w-sm flex-col gap-2">
          <Label htmlFor="certificate-signatory-name">Signatory name</Label>
          <Input
            id="certificate-signatory-name"
            placeholder="e.g. Principal, Noorul Huda Madrassa"
            aria-invalid={errors.signatoryName ? true : undefined}
            {...register("signatoryName")}
          />
          {errors.signatoryName ? (
            <p role="alert" className="text-sm text-destructive">
              {errors.signatoryName.message}
            </p>
          ) : null}
        </div>
        <SubmitButton isPending={isPending} pendingText="Saving…" className="self-start">
          Save signatory name
        </SubmitButton>
      </form>

      <div className="flex flex-col gap-2">
        <Label>Official seal</Label>
        <PhotoUpload
          bucket="certificate-assets"
          entityId="seal"
          currentUrl={settings.sealUrl}
          onPersist={updateCertificateSealAction}
          alt="Official seal"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Signature</Label>
        <PhotoUpload
          bucket="certificate-assets"
          entityId="signature"
          currentUrl={settings.signatureUrl}
          onPersist={updateCertificateSignatureAction}
          alt="Signature"
        />
      </div>
    </div>
  );
}
