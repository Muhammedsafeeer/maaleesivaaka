import type { Metadata } from "next";
import { listStudents } from "@/lib/services/student.service";
import { listGroups } from "@/lib/services/group.service";
import { StudentsTable } from "@/features/students/components/StudentsTable";
import { CreateStudentButton } from "@/features/students/components/CreateStudentButton";
import { StudentFilters } from "@/features/students/components/StudentFilters";
import type { Category } from "@/constants/programs";

export const metadata: Metadata = {
  title: "Students",
};

type StudentsPageProps = {
  searchParams: Promise<{ q?: string; category?: string; group?: string }>;
};

export default async function StudentsPage({ searchParams }: StudentsPageProps) {
  const params = await searchParams;

  const [students, groups] = await Promise.all([
    listStudents({
      q: params.q,
      category: params.category as Category | undefined,
      groupId: params.group,
    }),
    listGroups(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-xl font-medium">Students</h1>
          <p className="text-sm text-muted-foreground">
            {students.length} {students.length === 1 ? "student" : "students"}.
          </p>
        </div>
        <CreateStudentButton groups={groups} />
      </div>

      <StudentFilters groups={groups} />

      <StudentsTable students={students} groups={groups} />
    </div>
  );
}
