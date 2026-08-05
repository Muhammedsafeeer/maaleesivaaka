import type { Metadata } from "next";
import { listPublishedProgramPodiums } from "@/lib/services/result.service";
import { CATEGORIES } from "@/constants/programs";
import { ResultsPosterBrowser } from "@/features/results-poster/components/ResultsPosterBrowser";

export const metadata: Metadata = { title: "Results Poster" };

const categoryLabels = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]));

/**
 * Per-program "share this result" page — distinct from /admin/certificates (a
 * per-student keepsake): this generates one WhatsApp-sized poster image per
 * published program, listing its top three, for posting to a group chat.
 */
export default async function ResultsPosterPage() {
  const rows = await listPublishedProgramPodiums();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-heading text-xl font-medium">Results Poster</h1>
        <p className="text-sm text-muted-foreground">
          Download a shareable poster image of a published program&apos;s top three, ready to post
          to WhatsApp.
        </p>
      </div>

      <ResultsPosterBrowser rows={rows} categoryLabels={categoryLabels} />
    </div>
  );
}
