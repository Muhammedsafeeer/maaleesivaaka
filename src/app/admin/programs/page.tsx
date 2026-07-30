import type { Metadata } from "next";
import { listPrograms } from "@/lib/services/program.service";
import { ProgramsTable } from "@/features/programs/components/ProgramsTable";
import { CreateProgramButton } from "@/features/programs/components/CreateProgramButton";
import { ProgramFilters } from "@/features/programs/components/ProgramFilters";
import type { ProgramStatus } from "@/constants/programs";

export const metadata: Metadata = {
  title: "Programs",
};

type ProgramsPageProps = {
  searchParams: Promise<{ q?: string; status?: string }>;
};

export default async function ProgramsPage({ searchParams }: ProgramsPageProps) {
  const params = await searchParams;

  const programs = await listPrograms({
    q: params.q,
    status: params.status as ProgramStatus | undefined,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-xl font-medium">Programs</h1>
          <p className="text-sm text-muted-foreground">
            {programs.length} {programs.length === 1 ? "program" : "programs"}.
          </p>
        </div>
        <CreateProgramButton />
      </div>

      <ProgramFilters />

      <ProgramsTable programs={programs} />
    </div>
  );
}
