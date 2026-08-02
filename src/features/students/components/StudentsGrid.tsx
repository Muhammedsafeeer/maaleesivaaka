import { EmptyState } from "@/components/tables/EmptyState";
import { StudentCard } from "@/features/students/components/StudentCard";
import type { StudentWithGroup } from "@/types/student";
import type { Group } from "@/types/group";

export function StudentsGrid({
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
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {students.map((student) => (
        <StudentCard key={student.id} student={student} groups={groups} />
      ))}
    </div>
  );
}
