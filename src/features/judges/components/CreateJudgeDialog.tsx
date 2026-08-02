"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Gavel, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { createJudgeSchema, type CreateJudgeInput } from "@/features/judges/validation/judge.schema";

const emptyDefaults: CreateJudgeInput = { name: "", email: "", password: "" };

/**
 * Posts to /api/judges directly (fetch, not a Server Action import) — creating an
 * auth.users row needs the Admin API, which only a route handler holding the service
 * role key can call (see src/app/api/judges/route.ts).
 */
export function CreateJudgeDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateJudgeInput>({
    resolver: zodResolver(createJudgeSchema),
    defaultValues: emptyDefaults,
  });

  function onSubmit(values: CreateJudgeInput) {
    startTransition(async () => {
      const response = await fetch("/api/judges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const body = (await response.json()) as { error?: string };

      if (!response.ok) {
        toast.error(body.error ?? "Could not create the judge account. Please try again.");
        return;
      }

      toast.success("Judge account created.");
      reset(emptyDefaults);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset(emptyDefaults);
      }}
    >
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" data-icon="inline-start" />
        Add judge
      </Button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-house-yellow/20 text-house-yellow">
              <Gavel className="size-5" />
            </span>
            <div>
              <DialogTitle>Add judge</DialogTitle>
              <DialogDescription>
                Create a judge account with a password they can sign in with immediately.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="judge-name">Name</Label>
            <Input
              id="judge-name"
              autoComplete="off"
              aria-invalid={errors.name ? true : undefined}
              {...register("name")}
            />
            {errors.name ? (
              <p role="alert" className="text-sm text-destructive">
                {errors.name.message}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="judge-email">Email</Label>
            <Input
              id="judge-email"
              type="email"
              autoComplete="off"
              aria-invalid={errors.email ? true : undefined}
              {...register("email")}
            />
            {errors.email ? (
              <p role="alert" className="text-sm text-destructive">
                {errors.email.message}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="judge-password">Password</Label>
            <Input
              id="judge-password"
              type="password"
              autoComplete="new-password"
              aria-invalid={errors.password ? true : undefined}
              {...register("password")}
            />
            {errors.password ? (
              <p role="alert" className="text-sm text-destructive">
                {errors.password.message}
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <SubmitButton isPending={isPending} pendingText="Creating…">
              Create judge
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
