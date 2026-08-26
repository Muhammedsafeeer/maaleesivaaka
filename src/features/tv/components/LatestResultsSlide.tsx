import { PhotoThumbnail } from "@/components/tables/PhotoThumbnail";
import { CATEGORIES } from "@/constants/programs";
import type { LatestResultStudentRow } from "@/lib/services/result.service";

const categoryLabels = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]));
const POSITION_LABELS: Record<number, string> = { 1: "1st", 2: "2nd", 3: "3rd" };
const MAX_SHOWN = 6;

/** Latest results — plain `.tv-list*` classes (no Tailwind grid on the hall TV). */
export function LatestResultsSlide({ results }: { results: LatestResultStudentRow[] }) {
  if (results.length === 0) return null;
  const shown = results.slice(0, MAX_SHOWN);

  return (
    <div className="tv-slide">
      <p className="tv-slide-kicker">Latest Results</p>
      <div className="tv-list">
        {shown.map((result) => (
          <div key={result.id} className="tv-list-row">
            <PhotoThumbnail
              url={result.studentPhotoUrl}
              alt={`${result.studentName} photo`}
              className="tv-photo"
              sizePx={72}
              style={{ borderRadius: "999px" }}
            />
            <span className="tv-list-body">
              <span className="tv-list-name">{result.studentName}</span>
              <span className="tv-list-meta">
                {result.programName} · {categoryLabels[result.programCategory]}
              </span>
            </span>
            <span className="tv-list-badge">
              {POSITION_LABELS[result.position] ?? `#${result.position}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
