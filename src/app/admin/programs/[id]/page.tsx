import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProgram } from "@/lib/services/program.service";
import {
  listAssignedStudents,
  listAssignableStudents,
  listAssignedJudges,
  listAssignableJudges,
} from "@/lib/services/assignment.service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RosterTable } from "@/features/programs/components/RosterTable";
import { AssignStudentDialog } from "@/features/programs/components/AssignStudentDialog";
import { JudgeRosterTable } from "@/features/programs/components/JudgeRosterTable";
import { AssignJudgeDialog } from "@/features/programs/components/AssignJudgeDialog";
import { CATEGORIES, STAGE_TYPES, PROGRAM_STATUSES } from "@/constants/programs";

const categoryLabels = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]));
const stageTypeLabels = Object.fromEntries(STAGE_TYPES.map((s) => [s.value, s.label]));
const statusLabels = Object.fromEntries(PROGRAM_STATUSES.map((s) => [s.value, s.label]));

type ProgramDetailPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: ProgramDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const program = await getProgram(id);
  return { title: program?.name ?? "Program" };
}

export default async function ProgramDetailPage({ params }: ProgramDetailPageProps) {
  const { id } = await params;
  const program = await getProgram(id);

  if (!program) {
    notFound();
  }

  const [assignedStudents, assignableStudents, assignedJudges, assignableJudges] =
    await Promise.all([
      listAssignedStudents(id),
      listAssignableStudents(id),
      listAssignedJudges(id),
      listAssignableJudges(id),
    ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
          <Link href="/admin/programs">← Programs</Link>
        </Button>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-heading text-xl font-medium">{program.name}</h1>
          <Badge variant="outline">{categoryLabels[program.category]}</Badge>
          <Badge variant="outline">{stageTypeLabels[program.stage_type]}</Badge>
          <Badge variant={program.status === "published" ? "default" : "secondary"}>
            {statusLabels[program.status]}
          </Badge>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-medium">Roster</h2>
            <p className="text-sm text-muted-foreground">
              {assignedStudents.length}{" "}
              {assignedStudents.length === 1 ? "student" : "students"} assigned.
            </p>
          </div>
          <AssignStudentDialog programId={id} assignableStudents={assignableStudents} />
        </div>

        <RosterTable programId={id} students={assignedStudents} />
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-medium">Judges</h2>
            <p className="text-sm text-muted-foreground">
              {assignedJudges.length} {assignedJudges.length === 1 ? "judge" : "judges"}{" "}
              assigned.
            </p>
          </div>
          <AssignJudgeDialog programId={id} assignableJudges={assignableJudges} />
        </div>

        <JudgeRosterTable programId={id} judges={assignedJudges} />
      </div>
    </div>
  );
}
