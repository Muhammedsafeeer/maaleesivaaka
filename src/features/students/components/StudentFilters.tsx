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
import { CATEGORIES } from "@/constants/programs";
import type { Group } from "@/types/group";

const ALL = "all";

/**
 * Filters live in the URL (?q=&category=&group=), not client state — the students
 * page re-fetches server-side on every change (docs/agents.md's stated preference
 * order: Server Components before any client-side data layer). This component only
 * ever reads/writes the URL; it never holds the filtered list itself.
 */
export function StudentFilters({ groups }: { groups: Group[] }) {
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
        placeholder="Search by name or roll number…"
        defaultValue={searchParams.get("q") ?? ""}
        onChange={(event) => setParam("q", event.target.value)}
        className="sm:max-w-64"
        aria-label="Search students"
      />

      <Select
        value={searchParams.get("category") ?? ALL}
        onValueChange={(value) => setParam("category", value)}
      >
        <SelectTrigger aria-label="Filter by category" className="sm:w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All categories</SelectItem>
          {CATEGORIES.map((c) => (
            <SelectItem key={c.value} value={c.value}>
              {c.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("group") ?? ALL}
        onValueChange={(value) => setParam("group", value)}
      >
        <SelectTrigger aria-label="Filter by group" className="sm:w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All groups</SelectItem>
          {groups.map((group) => (
            <SelectItem key={group.id} value={group.id}>
              {group.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
