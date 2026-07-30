import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CATEGORIES, STAGE_TYPES, PROGRAM_STATUSES } from "@/constants/programs";
import type { AssignedProgramSummary } from "@/lib/services/scoring.service";

const categoryLabels = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]));
const stageTypeLabels = Object.fromEntries(STAGE_TYPES.map((s) => [s.value, s.label]));
const statusLabels = Object.fromEntries(PROGRAM_STATUSES.map((s) => [s.value, s.label]));

export function JudgeProgramCard({ program }: { program: AssignedProgramSummary }) {
  return (
    <Link href={`/judge/programs/${program.id}`} className="block">
      <Card className="transition-colors hover:bg-muted/50">
        <CardHeader>
          <CardTitle>{program.name}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{categoryLabels[program.category]}</Badge>
            <Badge variant="outline">{stageTypeLabels[program.stage_type]}</Badge>
            <Badge variant={program.status === "scoring" ? "default" : "secondary"}>
              {statusLabels[program.status]}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground tabular-nums">
            {program.scoredCount} of {program.totalStudents}{" "}
            {program.totalStudents === 1 ? "student" : "students"} scored
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
