import { AlertTriangle } from "lucide-react";
import type { TiedPositionGroup } from "@/lib/services/result.service";

const POSITION_LABELS: Record<number, string> = { 1: "1st", 2: "2nd", 3: "3rd" };

/**
 * Judge-facing tie alert (D-003 pipeline change, 20260819050000): scoring finished, but
 * finalize_program_results (SQL) refused to auto-complete this program because two or
 * more participants landed on the same position. Revise either tied row below to break
 * the tie (they're highlighted), or an admin can accept it as-is from their dashboard.
 */
export function TiedPositionsBanner({ ties }: { ties: TiedPositionGroup[] }) {
  if (ties.length === 0) {
    return null;
  }

  return (
    <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5">
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
      <div className="flex flex-col gap-1 text-sm text-destructive">
        <p className="font-medium">
          Scoring is complete, but {ties.length === 1 ? "a position is" : "positions are"} tied
          — results are held back until this is resolved.
        </p>
        <ul className="flex flex-col gap-0.5">
          {ties.map((group) => (
            <li key={group.position}>
              {POSITION_LABELS[group.position] ?? `#${group.position}`} ({group.points} pts):{" "}
              {group.participants.map((p) => p.name).join(" and ")} — highlighted below.
              Change either score to break the tie, or an admin can accept the tie as-is.
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
