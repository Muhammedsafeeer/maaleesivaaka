"use client";

import { useMemo, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
        // A tab strip stopped fitting once categories grew to six (D-021) — up to 7
        // entries (All + 6) overflowed TabsList's `w-fit inline-flex` on mobile with no
        // wrap/scroll handling. A Select never overflows regardless of category count.
        <Select value={activeCategory} onValueChange={(v) => setParam("category", v)}>
          <SelectTrigger aria-label="Filter by category" className="w-full sm:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All categories ({categoryCounts[ALL]})</SelectItem>
            {visibleCategories.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label} ({categoryCounts[c.value]})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <ProgramsTable programs={fullyFiltered} hideStageType={activeStage !== ALL} />
    </div>
  );
}
