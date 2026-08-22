import type { Metadata } from "next";
import Link from "next/link";
import { getPosterSettings } from "@/lib/services/posterSettings.service";
import { listCategories } from "@/lib/services/category.service";
import { PosterSettingsDesigner } from "@/features/poster-settings/components/PosterSettingsDesigner";

export const metadata: Metadata = { title: "Poster Settings" };

/**
 * Upload a poster background and drag its data fields into place — one design PER
 * CATEGORY (20260822000000_poster_settings_per_category.sql), switchable via the tabs
 * at the top of the designer. No shared "Default" design anymore (removed by explicit
 * request — every category must be configured on its own); a category with no
 * background set of its own falls back to the fixed public/poster.jpg design instead
 * (see ResultsPosterBrowser). The selected category's layout is what
 * /admin/results-poster renders onto that category's published programs (see
 * DynamicResultPosterTemplate).
 */
export default async function PosterSettingsPage() {
  const categories = await listCategories();
  const firstCategory = categories[0]?.value ?? null;
  const settings = await getPosterSettings(firstCategory);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-heading text-xl font-medium">Poster Settings</h1>
        <p className="text-sm text-muted-foreground">
          Upload a background image and drag the program name, winners, and other fields into
          place. Each category has its own design — a program is posted using its own
          category&apos;s layout.
        </p>
      </div>

      {categories.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">
            No categories yet — add one from{" "}
            <Link href="/admin/students" className="underline underline-offset-4">
              Students
            </Link>{" "}
            before designing a poster.
          </p>
        </div>
      ) : (
        <PosterSettingsDesigner initialSettings={settings} categories={categories} />
      )}
    </div>
  );
}
