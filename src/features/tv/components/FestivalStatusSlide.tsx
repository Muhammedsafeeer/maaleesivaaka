import type { CategoryStatus } from "@/lib/services/program.service";
import { CATEGORIES } from "@/constants/programs";

const categoryLabels = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]));

function pct(declared: number, total: number) {
  return total === 0 ? 0 : Math.round((declared / total) * 100);
}

/** Festival progress — plain `.tv-*` classes only (no Tailwind / inset / grid). */
export function FestivalStatusSlide({ statuses }: { statuses: CategoryStatus[] }) {
  const totalDeclared = statuses.reduce((sum, s) => sum + s.declared, 0);
  const totalAll = statuses.reduce((sum, s) => sum + s.total, 0);
  if (totalAll === 0) return null;
  const overallPct = pct(totalDeclared, totalAll);
  const rows = statuses.filter((status) => status.total > 0);

  return (
    <div className="tv-slide">
      <p className="tv-slide-kicker">Status of Festival</p>
      <p className="tv-podium-points" style={{ marginBottom: 8 }}>
        {overallPct}%
      </p>
      <p className="tv-slide-sub" style={{ marginBottom: 28 }}>
        {totalDeclared} of {totalAll} programs declared
      </p>
      <div className="tv-card-row">
        {rows.map((status) => {
          const p = pct(status.declared, status.total);
          return (
            <div key={status.category} className="tv-card" style={{ width: "28%", maxWidth: 280, minWidth: 160 }}>
              <p className="tv-card-sub" style={{ textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {categoryLabels[status.category]}
              </p>
              <p className="tv-card-title" style={{ fontSize: 28 }}>
                {status.declared} / {status.total}
              </p>
              <div
                style={{
                  marginTop: 12,
                  height: 8,
                  borderRadius: 999,
                  background: "rgba(247,243,232,0.15)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${p}%`,
                    height: "100%",
                    borderRadius: 999,
                    background: "#e8c44a",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
