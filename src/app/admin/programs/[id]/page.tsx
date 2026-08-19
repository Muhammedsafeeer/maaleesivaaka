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
import { GroupRosterPanel } from "@/features/programs/components/GroupRosterPanel";
import { ConvertToGroupButton } from "@/features/programs/components/ConvertToGroupButton";
import { JudgeRosterTable } from "@/features/programs/components/JudgeRosterTable";
import { AssignJudgeDialog } from "@/features/programs/components/AssignJudgeDialog";
import { ResultsPanel } from "@/features/programs/components/ResultsPanel";
import { listResults, listProgramPodiumForCertificates } from "@/lib/services/result.service";
import { listScoringCriteria, hasSubmittedScores } from "@/lib/services/scoringCriteria.service";
import { getCertificateSettings } from "@/lib/services/certificateSettings.service";
import { listGroupEntries } from "@/lib/services/groupEntry.service";
import { listGroups } from "@/lib/services/group.service";
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

  const [
    assignedStudents,
    assignableStudents,
    assignedJudges,
    assignableJudges,
    results,
    podiumRows,
    criteria,
    certificateSettings,
    groupEntries,
    groups,
    scored,
  ] = await Promise.all([
    listAssignedStudents(id),
    listAssignableStudents(id),
    listAssignedJudges(id),
    listAssignableJudges(id),
    listResults(id),
    listProgramPodiumForCertificates(id),
    listScoringCriteria(id),
    getCertificateSettings(),
    program.participation_type === "group" ? listGroupEntries(id) : Promise.resolve([]),
    program.participation_type === "group" ? listGroups() : Promise.resolve([]),
    program.participation_type === "individual" ? hasSubmittedScores(id) : Promise.resolve(false),
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
          {program.participation_type === "group" ? (
            <Badge variant="outline">Group</Badge>
          ) : null}
          <Badge variant={program.status === "published" ? "default" : "secondary"}>
            {statusLabels[program.status]}
          </Badge>
          {program.participation_type === "individual" ? (
            <ConvertToGroupButton programId={id} disabled={scored} />
          ) : null}
        </div>
      </div>

      {program.participation_type === "group" ? (
        <GroupRosterPanel
          programId={id}
          entries={groupEntries}
          groups={groups}
          assignedStudents={assignedStudents}
          assignableStudents={assignableStudents}
        />
      ) : (
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
      )}

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

      <ResultsPanel
        programId={id}
        programName={program.name}
        categoryLabel={categoryLabels[program.category]}
        status={program.status}
        results={results}
        podiumRows={podiumRows}
        criteria={criteria}
        certificateSettings={certificateSettings}
      />
    </div>
  );
}
