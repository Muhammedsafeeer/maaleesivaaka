import { Trophy } from "lucide-react";
import { PhotoThumbnail } from "@/components/tables/PhotoThumbnail";
import type { PublicResultRow } from "@/lib/services/result.service";

/**
 * A single highlighted "most recent 1st place" banner, pulled from the same
 * already-fetched latest-results feed (its first position === 1 entry, since that feed
 * is already sorted newest-first) rather than a separate query — this is a presentation
 * choice, not new data. D-017: house name only, same contract as LatestResultsList.
 */
export function LatestWinnerBanner({ winner }: { winner: PublicResultRow }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border-2 border-(--stage-gold) bg-(--stage-ivory) px-4 py-3 shadow-sm">
      <Trophy className="size-8 shrink-0 text-(--stage-gold-dim)" aria-hidden="true" />
      <PhotoThumbnail
        url={winner.groupPhotoUrl}
        alt={`${winner.groupName} photo`}
        className="size-12"
      />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold tracking-wide text-(--stage-gold-dim) uppercase">
          Latest Winner
        </p>
        <p className="truncate font-[family-name:var(--font-audience-display)] text-lg font-bold text-(--stage-ink)">
          {winner.groupName}
        </p>
        <p className="truncate text-sm text-(--stage-ink)/60">{winner.programName}</p>
      </div>
    </div>
  );
}
