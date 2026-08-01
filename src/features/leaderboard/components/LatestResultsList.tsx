import { Badge } from "@/components/ui/badge";
import { PhotoThumbnail } from "@/components/tables/PhotoThumbnail";
import type { PublicResultRow } from "@/lib/services/result.service";

const POSITION_LABELS: Record<number, string> = { 1: "1st", 2: "2nd", 3: "3rd" };

const timeFormatter = new Intl.DateTimeFormat("en-IN", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Kolkata",
});

/**
 * Audience "Latest Results" carousel — horizontal scroll (native CSS scroll-snap, no JS
 * arrow controls: works identically on a phone swipe and a desktop trackpad without an
 * extra client component). D-017: house name only, never a student's name — no field
 * for one exists on `PublicResultRow`.
 */
export function LatestResultsList({ results }: { results: PublicResultRow[] }) {
  if (results.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-(--stage-ivory)/60">
        Results appear here as soon as they&apos;re published.
      </p>
    );
  }

  return (
    <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2">
      {results.map((result) => (
        <div
          key={result.id}
          className="flex w-44 shrink-0 snap-start flex-col gap-2 rounded-xl bg-(--stage-ivory) p-3 shadow-sm"
        >
          <div className="flex items-center justify-between gap-2">
            <Badge className="border-none bg-(--stage-gold)/25 text-(--stage-gold-dim)">
              {POSITION_LABELS[result.position] ?? `#${result.position}`}
            </Badge>
            <PhotoThumbnail url={result.groupPhotoUrl} alt={`${result.groupName} photo`} />
          </div>
          <p className="truncate font-[family-name:var(--font-audience-display)] font-bold text-(--stage-ink)">
            {result.groupName}
          </p>
          <p className="line-clamp-2 text-xs text-(--stage-ink)/60">{result.programName}</p>
          <div className="mt-auto flex items-center justify-between gap-2 pt-1">
            <span className="font-mono text-xs font-semibold tabular-nums text-(--stage-ink)/70">
              +{result.points} pts
            </span>
            <span className="text-[0.65rem] text-(--stage-ink)/40">
              {timeFormatter.format(new Date(result.updatedAt))}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
