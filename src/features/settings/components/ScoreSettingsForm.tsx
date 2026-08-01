"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/forms/SubmitButton";
import {
  scoreSettingsFormSchema,
  type ScoreSettingsFormInput,
} from "@/features/settings/validation/settings.schema";
import { updateScoreSettingsAction } from "@/features/settings/actions/settings.actions";
import type { ScoreSettings } from "@/lib/services/scoreSettings.service";

const FIELDS = [
  { name: "firstPlacePoints", label: "1st place" },
  { name: "secondPlacePoints", label: "2nd place" },
  { name: "thirdPlacePoints", label: "3rd place" },
] as const;

export function ScoreSettingsForm({ settings }: { settings: ScoreSettings }) {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ScoreSettingsFormInput>({
    resolver: zodResolver(scoreSettingsFormSchema),
    defaultValues: {
      firstPlacePoints: String(settings.firstPlacePoints),
      secondPlacePoints: String(settings.secondPlacePoints),
      thirdPlacePoints: String(settings.thirdPlacePoints),
    },
  });

  function onSubmit(values: ScoreSettingsFormInput) {
    startTransition(async () => {
      const result = await updateScoreSettingsAction({
        firstPlacePoints: Number(values.firstPlacePoints),
        secondPlacePoints: Number(values.secondPlacePoints),
        thirdPlacePoints: Number(values.thirdPlacePoints),
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Points saved.");
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        {FIELDS.map((field) => (
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

      <SubmitButton isPending={isPending} pendingText="Saving…" className="self-start">
        Save points
      </SubmitButton>
    </form>
  );
}
