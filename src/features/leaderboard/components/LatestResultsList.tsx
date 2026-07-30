import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/tables/EmptyState";
import { PhotoThumbnail } from "@/components/tables/PhotoThumbnail";
import type { PublicResultRow } from "@/lib/services/result.service";

const POSITION_LABELS: Record<number, string> = { 1: "1st", 2: "2nd", 3: "3rd" };

/** D-017: house name only, never a student's name — PublicResultRow has no field for
 * one, so there is nothing here that could accidentally render it. */
export function LatestResultsList({ results }: { results: PublicResultRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Latest Results</CardTitle>
      </CardHeader>
      <CardContent>
        {results.length === 0 ? (
          <EmptyState
            title="No results published yet"
            description="Results appear here as soon as they're published."
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {results.map((result) => (
              <li
                key={result.id}
                className="flex items-center justify-between gap-4 rounded-lg border border-border px-3 py-2"
              >
                <span className="flex items-center gap-3">
                  <Badge variant={result.position <= 3 ? "default" : "outline"}>
                    {POSITION_LABELS[result.position] ?? `#${result.position}`}
                  </Badge>
                  <PhotoThumbnail
                    url={result.groupPhotoUrl}
                    alt={`${result.groupName} photo`}
                  />
                  <span className="font-medium">{result.groupName}</span>
                  <span className="text-sm text-muted-foreground">
                    {result.programName}
                  </span>
                </span>
                <span className="text-sm tabular-nums text-muted-foreground">
                  +{result.points} pts
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
