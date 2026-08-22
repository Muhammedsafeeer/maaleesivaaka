import type { Metadata } from "next";
import Link from "next/link";
import { listPublishedProgramPodiums } from "@/lib/services/result.service";
import { listAllPosterSettings } from "@/lib/services/posterSettings.service";
import { CATEGORIES } from "@/constants/programs";
import { ResultsPosterBrowser } from "@/features/results-poster/components/ResultsPosterBrowser";

export const metadata: Metadata = { title: "Results Poster" };

const categoryLabels = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]));

/**
 * Per-program "share this result" page — distinct from /admin/certificates (a
 * per-student keepsake): this generates one WhatsApp-sized poster image per
 * published program, listing its top three, for posting to a group chat. Each
 * program renders with ITS OWN category's design
 * (20260822000000_poster_settings_per_category.sql) — a "kids" program uses the kids
 * layout, once a background has been uploaded for it in Poster Settings; falls back
 * to the fixed public/poster.jpg design otherwise (see ResultsPosterBrowser). No
 * shared "Default" design anymore — removed by explicit request, every category is
 * configured on its own.
 */
export default async function ResultsPosterPage() {
  const [rows, posterSettingsList] = await Promise.all([listPublishedProgramPodiums(), listAllPosterSettings()]);

  const defaultSettings = posterSettingsList.find((s) => s.category === null) ?? {
    category: null,
    backgroundUrl: null,
    fields: [],
  };
  const hasAnyCustomLayout = posterSettingsList.some((s) => s.backgroundUrl);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-heading text-xl font-medium">Results Poster</h1>
        <p className="text-sm text-muted-foreground">
          Download a shareable poster image of a published program&apos;s top three, ready to post
          to WhatsApp.
          {hasAnyCustomLayout ? null : (
            <>
              {" "}
              No category has a custom layout set up yet — using the classic poster design.
              Configure one in{" "}
              <Link href="/admin/poster-settings" className="underline underline-offset-4">
                Poster Settings
              </Link>
              .
            </>
          )}
        </p>
      </div>

      <ResultsPosterBrowser
        rows={rows}
        categoryLabels={categoryLabels}
        posterSettingsList={posterSettingsList}
        defaultSettings={defaultSettings}
      />
    </div>
  );
}
