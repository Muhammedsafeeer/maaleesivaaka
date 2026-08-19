import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProgram } from "@/lib/services/program.service";
import { listScorableStudents, listScorableTeams } from "@/lib/services/scoring.service";
import { listScoringCriteria } from "@/lib/services/scoringCriteria.service";
import { listTiedPositions } from "@/lib/services/result.service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/tables/EmptyState";
import { ScoringForm } from "@/features/scoring/components/ScoringForm";
import { TeamScoringForm } from "@/features/scoring/components/TeamScoringForm";
import { TiedPositionsBanner } from "@/features/scoring/components/TiedPositionsBanner";
import { RealtimeProgramsListener } from "@/components/dashboard/RealtimeProgramsListener";
import { RealtimeProgramJudgesListener } from "@/components/dashboard/RealtimeProgramJudgesListener";
import { CATEGORIES, STAGE_TYPES, PROGRAM_STATUSES } from "@/constants/programs";

const categoryLabels = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]));
const stageTypeLabels = Object.fromEntries(STAGE_TYPES.map((s) => [s.value, s.label]));
const statusLabels = Object.fromEntries(PROGRAM_STATUSES.map((s) => [s.value, s.label]));

type JudgeScoringPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: JudgeScoringPageProps): Promise<Metadata> {
  const { id } = await params;
  const program = await getProgram(id);
  return { title: program ? `Score ${program.name}` : "Program" };
}

/**
 * getProgram runs through the regular (RLS-scoped) server client — a judge who isn't
 * assigned to this program gets no row back, same "RLS returns nothing → notFound()"
 * pattern as the admin program detail page, not a separate authorization check here.
 */
export default async function JudgeScoringPage({ params }: JudgeScoringPageProps) {
  const { id } = await params;
  const program = await getProgram(id);

  if (!program) {
    notFound();
  }

  const isGroup = program.participation_type === "group";

  const [students, teams, criteria, ties] = await Promise.all([
    isGroup ? Promise.resolve([]) : listScorableStudents(id),
    isGroup ? listScorableTeams(id) : Promise.resolve([]),
    listScoringCriteria(id),
    listTiedPositions(id),
  ]);
  const canEdit = program.status === "scoring";
  const tiedIds = new Set(
    ties.flatMap((group) =>
      group.participants.flatMap((p) => (isGroup ? (p.groupEntryId ? [p.groupEntryId] : []) : p.studentId ? [p.studentId] : [])),
    ),
  );

  return (
    <div className="flex flex-col gap-6">
      <RealtimeProgramsListener />
      <RealtimeProgramJudgesListener />

      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
          <Link href="/judge">← Dashboard</Link>
        </Button>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-heading text-xl font-medium">{program.name}</h1>
          <Badge variant="outline">{categoryLabels[program.category]}</Badge>
          <Badge variant="outline">{stageTypeLabels[program.stage_type]}</Badge>
          <Badge variant={program.status === "scoring" ? "default" : "secondary"}>
            {statusLabels[program.status]}
          </Badge>
        </div>
        {!canEdit ? (
          <p className="mt-2 text-sm text-muted-foreground">
            {program.status === "completed" || program.status === "published"
              ? "Scoring is closed for this program. Your submitted scores are shown below."
              : "Scoring isn't open for this program yet."}
          </p>
        ) : null}
      </div>

      <TiedPositionsBanner ties={ties} />

      {isGroup ? (
        teams.length === 0 ? (
          <EmptyState
            title="No teams yet"
            description="An admin hasn't added any teams to this program."
          />
        ) : (
          <TeamScoringForm
            programId={id}
            teams={teams}
            criteria={criteria}
            canEdit={canEdit}
            tiedIds={tiedIds}
          />
        )
      ) : students.length === 0 ? (
        <EmptyState
          title="No students assigned yet"
          description="An admin hasn't assigned any students to this program."
        />
      ) : (
        <ScoringForm
          programId={id}
          students={students}
          criteria={criteria}
          canEdit={canEdit}
          tiedIds={tiedIds}
        />
      )}
    </div>
  );
}
