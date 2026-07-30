import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/tables/EmptyState";
import { JudgeRowActions } from "@/features/judges/components/JudgeRowActions";
import type { Profile } from "@/types/profile";

export function JudgesTable({ judges }: { judges: Profile[] }) {
  if (judges.length === 0) {
    return (
      <EmptyState
        title="No judges yet"
        description="Add a judge to let them sign in and score assigned programs."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead className="w-px">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {judges.map((judge) => (
          <TableRow key={judge.id}>
            <TableCell className="font-medium">{judge.name}</TableCell>
            <TableCell>{judge.email}</TableCell>
            <TableCell>
              <JudgeRowActions judge={judge} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
