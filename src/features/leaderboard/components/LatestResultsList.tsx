import { ChevronRight } from "lucide-react";
import { PhotoThumbnail } from "@/components/tables/PhotoThumbnail";
import type { LatestResultStudentRow } from "@/lib/services/result.service";

const POSITION_LABELS: Record<number, string> = { 1: "1st", 2: "2nd", 3: "3rd" };

/**
 * Recency-sorted feed across every program and podium position — a compact table
 * (position badge, student, program, chevron), matching the density of the Kerala
 * Kalolsavam reference's "Latest Results" table. D-020 (docs/decisions.md): shows the
 * student's own name/photo, a deliberate widening of D-018's Latest Winner exception to
 * every entry in this feed, not just the single latest program's top 3.
 */
export function LatestResultsList({ results }: { results: LatestResultStudentRow[] }) {
  if (results.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-(--stage-ink)/50">
        Results appear here as soon as they&apos;re published.
      </p>
    );
  }

  return (
    <ol className="flex flex-col divide-y divide-(--stage-gold-dim)/15">
      {results.map((result) => (
        <li key={result.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-(--section-sapphire)/10 text-[0.65rem] font-bold text-(--section-sapphire)">
            {POSITION_LABELS[result.position] ?? `#${result.position}`}
          </span>
          <PhotoThumbnail
            url={result.studentPhotoUrl}
            alt={`${result.studentName} photo`}
            className="size-8"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-(--stage-ink)">
              {result.studentName}
            </p>
            <p className="truncate text-xs text-(--stage-ink)/50">{result.programName}</p>
          </div>
          <ChevronRight className="size-4 shrink-0 text-(--stage-ink)/30" aria-hidden="true" />
        </li>
      ))}
    </ol>
  );
}
