import { ChevronRight } from "lucide-react";
import { PhotoThumbnail } from "@/components/tables/PhotoThumbnail";
import type { PublicResultRow } from "@/lib/services/result.service";

/**
 * Every published program's 1st-place winner — a compact table (rank badge, house,
 * program, chevron), matching the density of the Kerala Kalolsavam reference's
 * "Leading Schools" table. `winners` is already sorted category-then-name by
 * listProgramWinners. D-017: house name only, same contract as LatestResultsList.
 */
export function ProgramWinnersList({ winners }: { winners: PublicResultRow[] }) {
  if (winners.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-(--stage-ink)/50">
        First-place winners appear here as results are published.
      </p>
    );
  }

  return (
    <ol className="flex flex-col divide-y divide-(--stage-gold-dim)/15">
      {winners.map((winner, index) => (
        <li key={winner.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-(--section-ruby)/10 text-xs font-bold text-(--section-ruby) tabular-nums">
            {index + 1}
          </span>
          <PhotoThumbnail url={winner.groupPhotoUrl} alt={`${winner.groupName} photo`} className="size-8" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-(--stage-ink)">{winner.groupName}</p>
            <p className="truncate text-xs text-(--stage-ink)/50">{winner.programName}</p>
          </div>
          <ChevronRight className="size-4 shrink-0 text-(--stage-ink)/30" aria-hidden="true" />
        </li>
      ))}
    </ol>
  );
}
