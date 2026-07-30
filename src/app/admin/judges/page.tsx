import type { Metadata } from "next";
import { listJudges } from "@/lib/services/judge.service";
import { JudgesTable } from "@/features/judges/components/JudgesTable";
import { CreateJudgeDialog } from "@/features/judges/components/CreateJudgeDialog";

export const metadata: Metadata = {
  title: "Judges",
};

export default async function JudgesPage() {
  const judges = await listJudges();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-xl font-medium">Judges</h1>
          <p className="text-sm text-muted-foreground">
            {judges.length} {judges.length === 1 ? "judge" : "judges"}.
          </p>
        </div>
        <CreateJudgeDialog />
      </div>

      <JudgesTable judges={judges} />
    </div>
  );
}
