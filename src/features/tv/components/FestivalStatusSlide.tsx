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
      <p className="tv-status-pct">{overallPct}%</p>
      <p className="tv-slide-sub">{totalDeclared} of {totalAll} programs declared</p>
      <div className="tv-card-row">
        {rows.map((status) => {
          const p = pct(status.declared, status.total);
          return (
            <div key={status.category} className="tv-card tv-status-card">
              <p className="tv-card-sub" style={{ textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {categoryLabels[status.category]}
              </p>
              <p className="tv-card-title">
                {status.declared} / {status.total}
              </p>
              <div className="tv-status-bar">
                <span style={{ width: `${p}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
