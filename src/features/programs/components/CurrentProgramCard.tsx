"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Radio } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProgramStatusBadge } from "@/features/programs/components/ProgramStatusBadge";
import { startNextProgramAction } from "@/features/programs/actions/fixture.actions";
import { CATEGORIES, type StageType } from "@/constants/programs";
import { cn } from "@/lib/utils";
import type { Program } from "@/types/program";

const categoryLabels = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]));

export function CurrentProgramCard({
  stageType,
  current,
  next,
}: {
  stageType: StageType;
  current: Program | null;
  next: Program | null;
}) {
  const [isPending, startTransition] = useTransition();

  function handleStart() {
    startTransition(async () => {
      const result = await startNextProgramAction(stageType);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Next program started.");
    });
  }

  return (
    <Card className={cn(current && "ring-podium-gold/40")}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {current ? (
            <span className="flex size-6 items-center justify-center rounded-lg bg-podium-gold/15 text-podium-gold">
              <Radio className="size-3.5 animate-pulse" />
            </span>
          ) : null}
          Now on stage
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {current ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-baseline gap-3">
              <span className="font-heading text-3xl font-semibold tabular-nums text-podium-gold">
                #{current.serial_number}
              </span>
              <span className="text-lg font-medium">{current.name}</span>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline">{categoryLabels[current.category]}</Badge>
              <ProgramStatusBadge status={current.status} />
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No program is currently on stage.</p>
        )}

        <div className="flex flex-col gap-2 border-t border-border pt-4">
          <p className="text-sm text-muted-foreground">
            {next ? (
              <>
                Next: <span className="font-medium text-foreground">#{next.serial_number} {next.name}</span>
              </>
            ) : (
              "No upcoming program is queued with a serial number."
            )}
          </p>
          <Button onClick={handleStart} disabled={isPending || !!current || !next}>
            {isPending ? "Starting…" : "Start next program"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
