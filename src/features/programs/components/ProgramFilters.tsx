"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PROGRAM_STATUSES } from "@/constants/programs";

const ALL = "all";

/** Same URL-params-as-source-of-truth pattern as StudentFilters — see that file's
 * comment for why (docs/agents.md's Server-Components-first preference order). */
export function ProgramFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams);
    if (!value || value === ALL) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Input
        placeholder="Search by name…"
        defaultValue={searchParams.get("q") ?? ""}
        onChange={(event) => setParam("q", event.target.value)}
        className="sm:max-w-64"
        aria-label="Search programs"
      />

      <Select
        value={searchParams.get("status") ?? ALL}
        onValueChange={(value) => setParam("status", value)}
      >
        <SelectTrigger aria-label="Filter by status" className="sm:w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All statuses</SelectItem>
          {PROGRAM_STATUSES.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
