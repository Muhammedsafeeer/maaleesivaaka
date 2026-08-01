import { Badge } from "@/components/ui/badge";
import { PhotoThumbnail } from "@/components/tables/PhotoThumbnail";
import { CATEGORIES } from "@/constants/programs";
import type { PublicResultRow } from "@/lib/services/result.service";

const categoryLabels = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]));

/**
 * Every published program's 1st-place winner, grouped by category — distinct from
 * LatestResultsList (recency-sorted, every podium position) so the audience can scan
 * "who won what" as a whole rather than only the most recent activity. `winners` is
 * already sorted category-then-name by listProgramWinners, so grouping here is a
 * single pass, not a re-sort. D-017: house name only, same contract as
 * LatestResultsList.
 */
export function ProgramWinnersList({ winners }: { winners: PublicResultRow[] }) {
  const grouped = new Map<string, PublicResultRow[]>();
  for (const winner of winners) {
    const group = grouped.get(winner.programCategory) ?? [];
    group.push(winner);
    grouped.set(winner.programCategory, group);
  }

  if (winners.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-(--stage-ivory)/60">
        First-place winners appear here as results are published.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {Array.from(grouped.entries()).map(([category, categoryWinners]) => (
        <div key={category} className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold tracking-wide text-(--stage-gold-bright)/80 uppercase">
            {categoryLabels[category] ?? category}
          </h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {categoryWinners.map((winner) => (
              <div
                key={winner.id}
                className="flex items-center gap-3 rounded-xl bg-(--stage-ivory) px-3 py-2 shadow-sm"
              >
                <PhotoThumbnail url={winner.groupPhotoUrl} alt={`${winner.groupName} photo`} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-(--stage-ink)">
                    {winner.groupName}
                  </p>
                  <p className="truncate text-xs text-(--stage-ink)/60">{winner.programName}</p>
                </div>
                <Badge className="border-none bg-(--stage-gold)/25 text-(--stage-gold-dim)">
                  1st
                </Badge>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
