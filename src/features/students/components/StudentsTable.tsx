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
import { StudentRowActions } from "@/features/students/components/StudentRowActions";
import { CATEGORIES, GENDERS } from "@/constants/programs";
import type { StudentWithGroup } from "@/types/student";
import type { Group } from "@/types/group";

const categoryLabels = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]));
const genderLabels = Object.fromEntries(GENDERS.map((g) => [g.value, g.label]));

export function StudentsTable({
  students,
  groups,
}: {
  students: StudentWithGroup[];
  groups: Group[];
}) {
  if (students.length === 0) {
    return (
      <EmptyState
        title="No students match"
        description="Try a different search or filter, or add a new student."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Roll no.</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Class</TableHead>
          <TableHead>Gender</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Group</TableHead>
          <TableHead className="w-px">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {students.map((student) => (
          <TableRow key={student.id}>
            <TableCell className="tabular-nums">{student.roll_number}</TableCell>
            <TableCell className="font-medium">{student.name}</TableCell>
            <TableCell>{student.class}</TableCell>
            <TableCell>{genderLabels[student.gender]}</TableCell>
            <TableCell>
              <Badge variant="outline">{categoryLabels[student.category]}</Badge>
            </TableCell>
            <TableCell>{student.group_name ?? "—"}</TableCell>
            <TableCell>
              <StudentRowActions student={student} groups={groups} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
