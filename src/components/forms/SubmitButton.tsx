import { Button } from "@/components/ui/button";
import type { ComponentProps } from "react";

type SubmitButtonProps = ComponentProps<typeof Button> & {
  isPending: boolean;
  pendingText: string;
};

/**
 * `isPending` is a controlled prop, not React's useFormStatus — every form in this
 * codebase drives its Server Action through react-hook-form's handleSubmit + a
 * useTransition (see features/auth/components/LoginForm.tsx), not a native
 * <form action={...}> binding, so useFormStatus's ambient context wouldn't see it.
 */
export function SubmitButton({
  isPending,
  pendingText,
  children,
  disabled,
  ...props
}: SubmitButtonProps) {
  return (
    <Button type="submit" disabled={isPending || disabled} {...props}>
      {isPending ? pendingText : children}
    </Button>
  );
}
