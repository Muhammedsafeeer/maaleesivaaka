import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getScoreSettings } from "@/lib/services/scoreSettings.service";
import { ScoreSettingsForm } from "@/features/settings/components/ScoreSettingsForm";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const settings = await getScoreSettings();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-xl font-medium">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure how the school function is scored.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Group leaderboard points</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Points a student&apos;s house earns for a podium finish in a program. Ties
            share a position and each receive its full points. Only affects programs
            finalized after you save — already-completed or published results keep the
            points they were given at the time.
          </p>
          <ScoreSettingsForm settings={settings} />
        </CardContent>
      </Card>
    </div>
  );
}
