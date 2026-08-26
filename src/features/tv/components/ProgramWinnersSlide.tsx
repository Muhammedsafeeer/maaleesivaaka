import { PhotoThumbnail } from "@/components/tables/PhotoThumbnail";
import type { PublicResultRow } from "@/lib/services/result.service";

const MAX_SHOWN = 8;

/** Recently published 1st-place houses — plain `.tv-list*` (no Tailwind on hall TV). */
export function ProgramWinnersSlide({ winners }: { winners: PublicResultRow[] }) {
  if (winners.length === 0) return null;

  const recent = [...winners]
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
    .slice(0, MAX_SHOWN);

  return (
    <div className="tv-slide">
      <p className="tv-slide-kicker">Recently Published</p>
      <div className="tv-list">
        {recent.map((winner) => (
          <div key={winner.id} className="tv-list-row">
            <span className="tv-list-medal" aria-hidden="true">
              1
            </span>
            <PhotoThumbnail
              url={winner.groupPhotoUrl}
              alt={`${winner.groupName} photo`}
              className="tv-photo"
              sizePx={64}
              style={{ borderRadius: "999px" }}
            />
            <span className="tv-list-body">
              <span className="tv-list-name">{winner.groupName}</span>
              <span className="tv-list-meta">{winner.programName}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
