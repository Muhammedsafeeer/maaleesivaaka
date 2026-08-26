import { PhotoThumbnail } from "@/components/tables/PhotoThumbnail";
import { CATEGORIES } from "@/constants/programs";
import type { LatestWinnerStudentRow } from "@/lib/services/result.service";

const categoryLabels = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]));
const POSITION_LABELS: Record<number, string> = { 1: "1st", 2: "2nd", 3: "3rd" };
const RANK_MEDAL: Record<number, string> = {
  1: "#d4a017",
  2: "#c0c0c0",
  3: "#cd7f32",
};

/** Just Declared podium — plain `.tv-winner-*` cards (no Tailwind on hall TV). */
export function LatestWinnerSlide({ results }: { results: LatestWinnerStudentRow[] }) {
  if (results.length === 0) return null;
  const programName = results[0].programName;

  return (
    <div className="tv-slide">
      <p className="tv-slide-kicker">Just Declared</p>
      <p className="tv-slide-title" style={{ marginBottom: 24 }}>
        {programName}
      </p>
      <div className="tv-card-row">
        {results.map((result) => (
          <div key={result.id} className="tv-winner-card">
            <PhotoThumbnail
              url={result.studentPhotoUrl}
              alt={`${result.studentName} photo`}
              className="tv-photo-hero"
              sizePx={220}
              style={{ width: "100%", maxWidth: "100%", height: 140, borderRadius: 0 }}
            />
            <div className="tv-winner-body">
              <span
                className="tv-list-badge"
                style={{
                  background: RANK_MEDAL[result.position] ?? "#e8c44a",
                  color: "#1a1028",
                  marginLeft: 0,
                  marginBottom: 8,
                }}
              >
                {POSITION_LABELS[result.position] ?? `#${result.position}`} ·{" "}
                {categoryLabels[result.programCategory] ?? result.programCategory}
              </span>
              <p className="tv-list-name" style={{ whiteSpace: "normal" }}>
                {result.studentName}
              </p>
            </div>
            <div className="tv-winner-foot">{result.points} points</div>
          </div>
        ))}
      </div>
    </div>
  );
}
