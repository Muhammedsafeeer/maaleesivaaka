"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/tables/EmptyState";
import {
  recalculateResultsAction,
  publishProgramAction,
} from "@/features/programs/actions/result.actions";
import type { listResults } from "@/lib/services/result.service";
import type { ProgramStatus } from "@/constants/programs";

type ResultRow = Awaited<ReturnType<typeof listResults>>[number];

export function ResultsPanel({
  programId,
  status,
  results,
}: {
  programId: string;
  status: ProgramStatus;
  results: ResultRow[];
}) {
  const [isRecalculating, startRecalculate] = useTransition();
  const [isPublishing, startPublish] = useTransition();

  function handleRecalculate() {
    startRecalculate(async () => {
      const result = await recalculateResultsAction(programId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Results recalculated.");
    });
  }

  function handlePublish() {
    startPublish(async () => {
      const result = await publishProgramAction(programId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Results published — visible to the audience now.");
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-medium">Results</h2>
          <p className="text-sm text-muted-foreground">
            {status === "published"
              ? "Published — visible to the audience."
              : status === "completed"
                ? "Calculated. Review before publishing."
                : "Calculated automatically once every assigned judge finishes scoring."}
          </p>
        </div>
        <div className="flex gap-2">
          {status === "scoring" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRecalculate}
              disabled={isRecalculating}
            >
              {isRecalculating ? "Checking…" : "Recalculate"}
            </Button>
          ) : null}
          {status === "completed" ? (
            <Button size="sm" onClick={handlePublish} disabled={isPublishing}>
              {isPublishing ? "Publishing…" : "Publish results"}
            </Button>
          ) : null}
        </div>
      </div>

      {results.length === 0 ? (
        <EmptyState
          title="No results yet"
          description="Results appear here once every assigned judge has scored every assigned student."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Position</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Average</TableHead>
              <TableHead>Points</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((result) => (
              <TableRow key={result.id}>
                <TableCell>
                  <Badge variant={result.position <= 3 ? "default" : "outline"}>
                    {result.position}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">
                  {result.students?.name ?? "—"}{" "}
                  <span className="text-muted-foreground">
                    ({result.students?.roll_number ?? "—"})
                  </span>
                </TableCell>
                <TableCell className="tabular-nums">{result.average_score}</TableCell>
                <TableCell className="tabular-nums">{result.points}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
