import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/tables/EmptyState";
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Program Winners</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {winners.length === 0 ? (
          <EmptyState
            title="No winners yet"
            description="First-place winners appear here as results are published."
          />
        ) : (
          Array.from(grouped.entries()).map(([category, categoryWinners]) => (
            <div key={category} className="flex flex-col gap-2">
              <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {categoryLabels[category] ?? category}
              </h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {categoryWinners.map((winner) => (
                  <div
                    key={winner.id}
                    className="flex items-center gap-3 rounded-lg border border-border px-3 py-2"
                  >
                    <PhotoThumbnail
                      url={winner.groupPhotoUrl}
                      alt={`${winner.groupName} photo`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{winner.groupName}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {winner.programName}
                      </p>
                    </div>
                    <Badge>1st</Badge>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
