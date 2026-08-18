import type { Metadata } from "next";
import { GraduationCap } from "lucide-react";
import { listStudents } from "@/lib/services/student.service";
import { listGroups } from "@/lib/services/group.service";
import { listPrograms } from "@/lib/services/program.service";
import { listProgramIdsByStudent } from "@/lib/services/assignment.service";
import { listCategories } from "@/lib/services/category.service";
import { StudentsGrid } from "@/features/students/components/StudentsGrid";
import { CreateStudentButton } from "@/features/students/components/CreateStudentButton";
import { StudentFilters } from "@/features/students/components/StudentFilters";

export const metadata: Metadata = {
  title: "Students",
};

type StudentsPageProps = {
  searchParams: Promise<{ q?: string; category?: string; group?: string }>;
};

export default async function StudentsPage({ searchParams }: StudentsPageProps) {
  const params = await searchParams;

  const [students, groups, programs, programIdsByStudent, categories] = await Promise.all([
    listStudents({
      q: params.q,
      category: params.category,
      groupId: params.group,
    }),
    listGroups(),
    listPrograms(),
    listProgramIdsByStudent(),
    listCategories(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-house-blue/15 text-house-blue">
            <GraduationCap className="size-5" />
          </span>
          <div>
            <h1 className="font-heading text-xl font-medium">Students</h1>
            <p className="text-sm text-muted-foreground">
              {students.length} {students.length === 1 ? "student" : "students"}.
            </p>
          </div>
        </div>
        <CreateStudentButton groups={groups} programs={programs} categories={categories} />
      </div>

      <StudentFilters groups={groups} categories={categories} />

      <StudentsGrid
        students={students}
        groups={groups}
        programs={programs}
        programIdsByStudent={programIdsByStudent}
        categories={categories}
      />
    </div>
  );
}
