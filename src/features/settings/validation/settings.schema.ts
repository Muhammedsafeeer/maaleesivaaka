import { z } from "zod";

/** No hard upper bound in docs/project.md — 1000 is just a sanity ceiling against a
 * typo (e.g. an extra digit), not a modeled business rule. */
const pointsValueSchema = z.coerce
  .number({ error: "Enter a number." })
  .int("Points must be a whole number.")
  .min(0, "Points can't be negative.")
  .max(1000, "That doesn't look right — enter a smaller number.");

/** Server Action input/re-validation — numbers in, numbers out. */
export const scoreSettingsSchema = z.object({
  firstPlacePoints: pointsValueSchema,
  secondPlacePoints: pointsValueSchema,
  thirdPlacePoints: pointsValueSchema,
});

export type ScoreSettingsInput = z.infer<typeof scoreSettingsSchema>;

/**
 * Client-only string-typed mirror for the form's zodResolver. `z.coerce.number()`
 * makes a schema's input and output types diverge (input `unknown`, output `number`),
 * which breaks react-hook-form's Resolver typing when useForm is given an explicit
 * generic — same issue program.schema.ts's comment documents for `.default()`. Reuses
 * pointsValueSchema for the actual bounds check via .refine rather than repeating it.
 */
const pointsFieldSchema = z
  .string()
  .trim()
  .refine((value) => pointsValueSchema.safeParse(value).success, {
    message: "Enter a whole number, 0 or greater.",
  });

export const scoreSettingsFormSchema = z.object({
  firstPlacePoints: pointsFieldSchema,
  secondPlacePoints: pointsFieldSchema,
  thirdPlacePoints: pointsFieldSchema,
});

export type ScoreSettingsFormInput = z.infer<typeof scoreSettingsFormSchema>;
