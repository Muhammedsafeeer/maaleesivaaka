"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { STAGE_TYPES } from "@/constants/programs";
import { ProgramsTable } from "@/features/programs/components/ProgramsTable";
import type { Program } from "@/types/program";

const ALL = "all";

export function ProgramStageTabs({ programs }: { programs: Program[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const activeTab = searchParams.get("stage") ?? ALL;

  function setTab(value: string) {
    const params = new URLSearchParams(searchParams);
    if (value === ALL) {
      params.delete("stage");
    } else {
      params.set("stage", value);
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  const counts: Record<string, number> = {
    [ALL]: programs.length,
    ...Object.fromEntries(
      STAGE_TYPES.map((s) => [
        s.value,
        programs.filter((p) => p.stage_type === s.value).length,
      ]),
    ),
  };

  const filtered =
    activeTab === ALL
      ? programs
      : programs.filter((p) => p.stage_type === activeTab);

  return (
    <Tabs value={activeTab} onValueChange={setTab}>
      <TabsList>
        <TabsTrigger value={ALL}>
          All
          <Badge variant="secondary" className="ml-1 tabular-nums">
            {counts[ALL]}
          </Badge>
        </TabsTrigger>
        {STAGE_TYPES.map((s) => (
          <TabsTrigger key={s.value} value={s.value}>
            {s.label}
            <Badge variant="secondary" className="ml-1 tabular-nums">
              {counts[s.value]}
            </Badge>
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value={activeTab}>
        <ProgramsTable programs={filtered} hideStageType={activeTab !== ALL} />
      </TabsContent>
    </Tabs>
  );
}
