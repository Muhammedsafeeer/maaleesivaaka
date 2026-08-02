import type { Metadata } from "next";
import { Gavel } from "lucide-react";
import { listJudges } from "@/lib/services/judge.service";
import { JudgesGrid } from "@/features/judges/components/JudgesGrid";
import { CreateJudgeDialog } from "@/features/judges/components/CreateJudgeDialog";

export const metadata: Metadata = {
  title: "Judges",
};

export default async function JudgesPage() {
  const judges = await listJudges();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-house-yellow/20 text-house-yellow">
            <Gavel className="size-5" />
          </span>
          <div>
            <h1 className="font-heading text-xl font-medium">Judges</h1>
            <p className="text-sm text-muted-foreground">
              {judges.length} {judges.length === 1 ? "judge" : "judges"}.
            </p>
          </div>
        </div>
        <CreateJudgeDialog />
      </div>

      <JudgesGrid judges={judges} />
    </div>
  );
}
