import { Medal } from "lucide-react";
import { PhotoThumbnail } from "@/components/tables/PhotoThumbnail";
import type { PublicResultRow } from "@/lib/services/result.service";

const MAX_SHOWN = 8;

/**
 * "Last published program(s)" slide — every published program's 1st-place house,
 * newest first (listProgramWinners() itself sorts by category for the interactive
 * /audience page; re-sorted by recency here since this slide is specifically about
 * what just got published). House-only, same D-017 contract as the rest of this app's
 * public surfaces.
 */
export function ProgramWinnersSlide({ winners }: { winners: PublicResultRow[] }) {
  if (winners.length === 0) return null;

  const recent = [...winners]
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
    .slice(0, MAX_SHOWN);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-(--tv-40) px-(--tv-64) py-(--tv-48)">
      <p className="text-[length:var(--tv-24)] font-bold tracking-[0.3em] text-(--stage-spotlight-gold) uppercase">
        Recently Published
      </p>

      <div className="grid w-[min(92vw,64rem)] grid-cols-2 gap-(--tv-20)">
        {recent.map((winner, i) => (
          <div
            key={winner.id}
            className="animate-in fade-in slide-in-from-left-4 flex items-center gap-(--tv-16) rounded-2xl bg-(--stage-spotlight-card) px-(--tv-20) py-(--tv-16) fill-mode-both"
            style={{ animationDelay: `${i * 90}ms`, animationDuration: "500ms" }}
          >
            <span className="flex size-(--tv-40) shrink-0 items-center justify-center rounded-xl bg-(--stage-spotlight-gold)/15 text-(--stage-spotlight-gold)">
              <Medal className="size-(--tv-20)" />
            </span>
            <PhotoThumbnail
              url={winner.groupPhotoUrl}
              alt={`${winner.groupName} photo`}
              className="size-(--tv-48) rounded-full"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[length:var(--tv-18)] font-bold text-(--stage-spotlight-ink)">
                {winner.groupName}
              </p>
              <p className="truncate text-[length:var(--tv-14)] text-(--stage-spotlight-ink-dim)">
                {winner.programName}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
