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
    <div className="flex h-full flex-col items-center justify-center gap-10 px-16 py-12">
      <p className="text-2xl font-bold tracking-[0.3em] text-(--stage-spotlight-gold) uppercase">
        Recently Published
      </p>

      <div className="grid max-w-5xl grid-cols-2 gap-5">
        {recent.map((winner, i) => (
          <div
            key={winner.id}
            className="animate-in fade-in slide-in-from-left-4 flex items-center gap-4 rounded-2xl bg-(--stage-spotlight-card) px-5 py-4 fill-mode-both"
            style={{ animationDelay: `${i * 90}ms`, animationDuration: "500ms" }}
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-(--stage-spotlight-gold)/15 text-(--stage-spotlight-gold)">
              <Medal className="size-5" />
            </span>
            <PhotoThumbnail
              url={winner.groupPhotoUrl}
              alt={`${winner.groupName} photo`}
              className="size-12 rounded-full"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-bold text-(--stage-spotlight-ink)">
                {winner.groupName}
              </p>
              <p className="truncate text-sm text-(--stage-spotlight-ink-dim)">
                {winner.programName}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
