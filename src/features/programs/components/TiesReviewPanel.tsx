"use client";

import { useEffect, useRef, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { setProgramStatusAction } from "@/features/programs/actions/fixture.actions";
import type { UnresolvedTieProgram } from "@/lib/services/result.service";

const POSITION_LABELS: Record<number, string> = { 1: "1st", 2: "2nd", 3: "3rd" };

function AcceptTieButton({ programId }: { programId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleAccept() {
    startTransition(async () => {
      const result = await setProgramStatusAction(programId, "completed");
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Tie accepted — results finalized as-is.");
    });
  }

  return (
    <Button size="sm" variant="outline" onClick={handleAccept} disabled={isPending}>
      {isPending ? "Accepting…" : "Accept tie & finalize"}
    </Button>
  );
}

/**
 * Admin dashboard "needs a decision" surface: every program currently blocked because
 * two or more participants landed on the same position after full scoring. finalize_
 * program_results (SQL) already refused to auto-complete these — this is where the
 * admin either accepts the tie as-is (D-004's original shared-position/full-points
 * behavior, applied via the same status override the Fixture page already exposes) or
 * leaves it for the judge to revise a score from their own scoring page (where the
 * same tie shows as a banner). Hidden entirely when there's nothing to review, same
 * "don't show an always-empty section" convention as the rest of the dashboard.
 */
export function TiesReviewPanel({ ties }: { ties: UnresolvedTieProgram[] }) {
  const seenProgramIds = useRef<Set<string> | null>(null);

  // Fires a toast only for a program that's newly tied since the last render — not on
  // every unrelated `results` change that happens to re-run this component (the
  // Realtime listener in AdminLayout triggers router.refresh() for any results row).
  // Above the zero-ties early return so it still runs (and updates the ref) on every
  // transition, including down to zero.
  useEffect(() => {
    const previouslySeen = seenProgramIds.current;
    const currentIds = new Set(ties.map((tie) => tie.programId));

    if (previouslySeen) {
      for (const tie of ties) {
        if (!previouslySeen.has(tie.programId)) {
          toast.warning(`Tie in ${tie.programName} — needs a decision.`, {
            description: tie.groups
              .map(
                (group) =>
                  `${POSITION_LABELS[group.position] ?? `#${group.position}`}: ${group.participants
                    .map((p) => p.name)
                    .join(" and ")}`,
              )
              .join("; "),
          });
        }
      }
    }

    seenProgramIds.current = currentIds;
  }, [ties]);

  if (ties.length === 0) {
    return null;
  }

  return (
    <Card
      size="sm"
      className="animate-in fade-in slide-in-from-top-2 bg-destructive/5 ring-destructive/30 duration-300"
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-lg bg-destructive/15 text-destructive">
            <AlertTriangle className="size-3.5" />
          </span>
          Ties needing a decision
          <Badge variant="destructive">{ties.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {ties.map((tie) => (
          <div key={tie.programId} className="rounded-lg border border-border p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <Link
                  href={`/admin/programs/${tie.programId}`}
                  className="text-sm font-medium hover:underline"
                >
                  {tie.programName}
                </Link>
                <p className="text-xs text-muted-foreground">
                  Scoring is complete but held back until this is resolved.
                </p>
              </div>
              <AcceptTieButton programId={tie.programId} />
            </div>
            <ul className="mt-2 flex flex-col gap-1">
              {tie.groups.map((group) => (
                <li key={group.position} className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {POSITION_LABELS[group.position] ?? `#${group.position}`}
                  </span>{" "}
                  ({group.points} pts) — {group.participants.map((p) => p.name).join(" and ")}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
