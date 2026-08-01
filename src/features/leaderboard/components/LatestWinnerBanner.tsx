import { Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PhotoThumbnail } from "@/components/tables/PhotoThumbnail";
import type { PublicResultRow } from "@/lib/services/result.service";

/**
 * A single highlighted "most recent 1st place" card, pulled from the same
 * already-fetched latest-results feed (its first position === 1 entry, since that feed
 * is already sorted newest-first) rather than a separate query — this is a presentation
 * choice, not new data. D-017: house name only, same contract as LatestResultsList.
 */
export function LatestWinnerBanner({ winner }: { winner: PublicResultRow }) {
  return (
    <Card className="border-primary/40 bg-primary/5">
      <CardContent className="flex items-center gap-4">
        <Trophy className="size-8 shrink-0 text-primary" aria-hidden="true" />
        <PhotoThumbnail
          url={winner.groupPhotoUrl}
          alt={`${winner.groupName} photo`}
          className="size-12"
        />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium tracking-wide text-primary uppercase">
            Latest Winner
          </p>
          <p className="truncate text-lg font-semibold">{winner.groupName}</p>
          <p className="truncate text-sm text-muted-foreground">{winner.programName}</p>
        </div>
      </CardContent>
    </Card>
  );
}
