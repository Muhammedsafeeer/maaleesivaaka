"use client";

import { useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { SubmitButton } from "@/components/forms/SubmitButton";
import {
  scoreSettingsFormSchema,
  type ScoreSettingsFormInput,
} from "@/features/settings/validation/settings.schema";
import { updateScoreSettingsAction } from "@/features/settings/actions/settings.actions";
import type { ScoreSettings } from "@/lib/services/scoreSettings.service";

const INDIVIDUAL_FIELDS = [
  { name: "firstPlacePoints", label: "1st place" },
  { name: "secondPlacePoints", label: "2nd place" },
  { name: "thirdPlacePoints", label: "3rd place" },
] as const;

const GROUP_FIELDS = [
  { name: "groupFirstPlacePoints", label: "1st place" },
  { name: "groupSecondPlacePoints", label: "2nd place" },
  { name: "groupThirdPlacePoints", label: "3rd place" },
] as const;

export function ScoreSettingsForm({ settings }: { settings: ScoreSettings }) {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ScoreSettingsFormInput>({
    resolver: zodResolver(scoreSettingsFormSchema),
    defaultValues: {
      firstPlacePoints: String(settings.firstPlacePoints),
      secondPlacePoints: String(settings.secondPlacePoints),
      thirdPlacePoints: String(settings.thirdPlacePoints),
      groupFirstPlacePoints: String(settings.groupFirstPlacePoints),
      groupSecondPlacePoints: String(settings.groupSecondPlacePoints),
      groupThirdPlacePoints: String(settings.groupThirdPlacePoints),
      allowJudgeRescore: settings.allowJudgeRescore,
    },
  });

  function onSubmit(values: ScoreSettingsFormInput) {
    startTransition(async () => {
      const result = await updateScoreSettingsAction({
        firstPlacePoints: Number(values.firstPlacePoints),
        secondPlacePoints: Number(values.secondPlacePoints),
        thirdPlacePoints: Number(values.thirdPlacePoints),
        groupFirstPlacePoints: Number(values.groupFirstPlacePoints),
        groupSecondPlacePoints: Number(values.groupSecondPlacePoints),
        groupThirdPlacePoints: Number(values.groupThirdPlacePoints),
        allowJudgeRescore: values.allowJudgeRescore,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Points saved.");
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Individual programs
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {INDIVIDUAL_FIELDS.map((field) => (
            <div key={field.name} className="flex flex-col gap-2">
              <Label htmlFor={`score-settings-${field.name}`}>{field.label}</Label>
              <Input
                id={`score-settings-${field.name}`}
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                aria-invalid={errors[field.name] ? true : undefined}
                {...register(field.name)}
              />
              {errors[field.name] ? (
                <p role="alert" className="text-sm text-destructive">
                  {errors[field.name]?.message}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Group programs
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {GROUP_FIELDS.map((field) => (
            <div key={field.name} className="flex flex-col gap-2">
              <Label htmlFor={`score-settings-${field.name}`}>{field.label}</Label>
              <Input
                id={`score-settings-${field.name}`}
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                aria-invalid={errors[field.name] ? true : undefined}
                {...register(field.name)}
              />
              {errors[field.name] ? (
                <p role="alert" className="text-sm text-destructive">
                  {errors[field.name]?.message}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <Controller
        control={control}
        name="allowJudgeRescore"
        render={({ field }) => (
          <label className="flex cursor-pointer items-start gap-2">
            <Checkbox
              id="score-settings-allow-judge-rescore"
              checked={field.value}
              onCheckedChange={(value) => field.onChange(value === true)}
            />
            <span>
              <span className="block text-sm font-medium">
                Let judges rescore a completed program
              </span>
              <span className="block text-sm text-muted-foreground">
                Normally a judge&apos;s scoring form locks the moment a program is marked
                completed. Turning this on lets them keep revising their own scores until
                you publish it — an admin&apos;s authorization is still required to change
                any score already submitted.
              </span>
            </span>
          </label>
        )}
      />

      <SubmitButton isPending={isPending} pendingText="Saving…" className="self-start">
        Save points
      </SubmitButton>
    </form>
  );
}
