import type { Metadata } from "next";
import { getPosterSettings } from "@/lib/services/posterSettings.service";
import { listCategories } from "@/lib/services/category.service";
import { PosterSettingsDesigner } from "@/features/poster-settings/components/PosterSettingsDesigner";

export const metadata: Metadata = { title: "Poster Settings" };

/**
 * Upload a poster background and drag its data fields into place — one design PER
 * CATEGORY (20260822000000_poster_settings_per_category.sql), switchable via the tabs
 * at the top of the designer, plus a "Default" design used as the fallback for any
 * category without one. The selected category's layout is what
 * /admin/results-poster renders onto that category's published programs (see
 * DynamicResultPosterTemplate), instead of the fixed public/poster.jpg design, once a
 * background has been uploaded for it.
 */
export default async function PosterSettingsPage() {
  const [settings, categories] = await Promise.all([getPosterSettings(null), listCategories()]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-heading text-xl font-medium">Poster Settings</h1>
        <p className="text-sm text-muted-foreground">
          Upload a background image and drag the program name, winners, and other fields into
          place. Each category has its own design — a program is posted using its own
          category&apos;s layout, falling back to Default if that category has none of its own yet.
        </p>
      </div>

      <PosterSettingsDesigner initialSettings={settings} categories={categories} />
    </div>
  );
}
