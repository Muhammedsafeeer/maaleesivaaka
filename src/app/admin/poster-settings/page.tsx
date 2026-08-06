import type { Metadata } from "next";
import { getPosterSettings } from "@/lib/services/posterSettings.service";
import { PosterSettingsDesigner } from "@/features/poster-settings/components/PosterSettingsDesigner";

export const metadata: Metadata = { title: "Poster Settings" };

/**
 * Upload a poster background and drag its data fields into place — the layout this
 * saves is what /admin/results-poster renders onto every published program's poster
 * (see DynamicResultPosterTemplate), instead of the fixed public/poster.jpg design,
 * once a background has been uploaded here.
 */
export default async function PosterSettingsPage() {
  const settings = await getPosterSettings();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-heading text-xl font-medium">Poster Settings</h1>
        <p className="text-sm text-muted-foreground">
          Upload a background image and drag the program name, winners, and other fields into
          place. This layout is used for every published program&apos;s results poster.
        </p>
      </div>

      <PosterSettingsDesigner settings={settings} />
    </div>
  );
}
