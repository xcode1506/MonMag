"use client";

import * as React from "react";
import { useActionState } from "react";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/action-result";

type FormAction = (formData: FormData) => Promise<ActionResult>;

interface Options {
  successMessage?: string;
  onSuccess?: () => void;
}

/** Bridges a Server Action to React 19 form state with consistent feedback. */
export function useActionForm(action: FormAction, options: Options = {}) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    async (_previous, formData) => action(formData),
    null,
  );
  const onSuccessRef = React.useRef(options.onSuccess);
  const successMessageRef = React.useRef(options.successMessage);

  React.useEffect(() => {
    onSuccessRef.current = options.onSuccess;
    successMessageRef.current = options.successMessage;
  }, [options.onSuccess, options.successMessage]);

  React.useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(state.message ?? successMessageRef.current ?? "Saved.");
      onSuccessRef.current?.();
    } else {
      toast.error(state.error);
    }
  }, [state]);

  const fieldErrors = state && !state.ok ? state.fieldErrors ?? {} : {};
  return { state, formAction, pending, fieldErrors };
}
