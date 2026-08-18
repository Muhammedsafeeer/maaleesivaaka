"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { STAGE_TYPES } from "@/constants/programs";
import type { Program } from "@/types/program";

const stageLabels = Object.fromEntries(STAGE_TYPES.map((s) => [s.value, s.label]));

export function StudentProgramPicker({
  programs,
  selectedIds,
  onChange,
  error,
}: {
  programs: Program[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label>Programs</Label>
      {programs.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No programs in this category yet. You can still create the student and assign
          a program later.
        </p>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            Only programs in this student&apos;s category are listed. Select one or more.
          </p>
          <div className="max-h-40 overflow-y-auto rounded-lg border border-border">
            {programs.map((program) => {
              const checked = selectedIds.includes(program.id);
              return (
                <label
                  key={program.id}
                  className="flex cursor-pointer items-center gap-2 px-3 py-2 hover:bg-muted/60"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(value) => {
                      if (value === true) {
                        onChange([...selectedIds, program.id]);
                        return;
                      }
                      onChange(selectedIds.filter((id) => id !== program.id));
                    }}
                  />
                  <span className="min-w-0 flex-1 truncate">{program.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {stageLabels[program.stage_type]}
                  </span>
                </label>
              );
            })}
          </div>
        </>
      )}
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
