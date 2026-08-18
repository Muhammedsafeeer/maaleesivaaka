"use client";

import { useMemo, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CATEGORIES, STAGE_TYPES } from "@/constants/programs";
import { ProgramsTable } from "@/features/programs/components/ProgramsTable";
import type { Program } from "@/types/program";

const ALL = "all";

export function ProgramStageTabs({ programs }: { programs: Program[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const activeStage = searchParams.get("stage") ?? ALL;
  const activeCategory = searchParams.get("category") ?? ALL;

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams);
    if (value === ALL) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  const stageFiltered = useMemo(
    () =>
      activeStage === ALL
        ? programs
        : programs.filter((p) => p.stage_type === activeStage),
    [programs, activeStage],
  );

  const fullyFiltered = useMemo(
    () =>
      activeCategory === ALL
        ? stageFiltered
        : stageFiltered.filter((p) => p.category === activeCategory),
    [stageFiltered, activeCategory],
  );

  const stageCounts: Record<string, number> = {
    [ALL]: programs.length,
    ...Object.fromEntries(
      STAGE_TYPES.map((s) => [
        s.value,
        programs.filter((p) => p.stage_type === s.value).length,
      ]),
    ),
  };

  const categoryCounts: Record<string, number> = {
    [ALL]: stageFiltered.length,
    ...Object.fromEntries(
      CATEGORIES.map((c) => [
        c.value,
        stageFiltered.filter((p) => p.category === c.value).length,
      ]),
    ),
  };

  // Only show categories that have at least one program in the current stage filter
  const visibleCategories = CATEGORIES.filter((c) => categoryCounts[c.value] > 0);

  return (
    <div className="flex flex-col gap-3">
      <Tabs value={activeStage} onValueChange={(v) => setParam("stage", v)}>
        <TabsList>
          <TabsTrigger value={ALL}>
            All
            <Badge variant="secondary" className="ml-1 tabular-nums">
              {stageCounts[ALL]}
            </Badge>
          </TabsTrigger>
          {STAGE_TYPES.map((s) => (
            <TabsTrigger key={s.value} value={s.value}>
              {s.label}
              <Badge variant="secondary" className="ml-1 tabular-nums">
                {stageCounts[s.value]}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {visibleCategories.length > 1 && (
        <Tabs value={activeCategory} onValueChange={(v) => setParam("category", v)}>
          <TabsList variant="line">
            <TabsTrigger value={ALL}>
              All
              <Badge variant="secondary" className="ml-1 tabular-nums">
                {categoryCounts[ALL]}
              </Badge>
            </TabsTrigger>
            {visibleCategories.map((c) => (
              <TabsTrigger key={c.value} value={c.value}>
                {c.label}
                <Badge variant="secondary" className="ml-1 tabular-nums">
                  {categoryCounts[c.value]}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      <ProgramsTable programs={fullyFiltered} hideStageType={activeStage !== ALL} />
    </div>
  );
}
