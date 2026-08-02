import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/tables/EmptyState";
import { ProgramRowActions } from "@/features/programs/components/ProgramRowActions";
import { ProgramStatusBadge } from "@/features/programs/components/ProgramStatusBadge";
import { CATEGORIES, STAGE_TYPES } from "@/constants/programs";
import type { Program } from "@/types/program";

const categoryLabels = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]));
const stageTypeLabels = Object.fromEntries(STAGE_TYPES.map((s) => [s.value, s.label]));

export function ProgramsTable({ programs }: { programs: Program[] }) {
  if (programs.length === 0) {
    return (
      <EmptyState
        title="No programs match"
        description="Try a different search or filter, or add a new program."
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Stage type</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-px">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {programs.map((program) => (
            <TableRow key={program.id}>
              <TableCell className="font-medium whitespace-nowrap">
                <Link href={`/admin/programs/${program.id}`} className="hover:underline">
                  {program.name}
                </Link>
              </TableCell>
              <TableCell className="whitespace-nowrap">{stageTypeLabels[program.stage_type]}</TableCell>
              <TableCell>
                <Badge variant="outline">{categoryLabels[program.category]}</Badge>
              </TableCell>
              <TableCell>
                <ProgramStatusBadge status={program.status} />
              </TableCell>
              <TableCell>
                <ProgramRowActions program={program} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
