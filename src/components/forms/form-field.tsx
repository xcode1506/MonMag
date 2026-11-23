import * as React from "react";
import { Field, FieldError, Label } from "@/components/ui/field";

interface FormFieldProps {
  label: string;
  name: string;
  children: React.ReactNode;
  error?: string[];
  hint?: string;
  className?: string;
}

/** Associates a labelled form control with its server-side validation error. */
export function FormField({ label, name, children, error, hint, className }: FormFieldProps) {
  return (
    <Field className={className}>
      <Label htmlFor={name}>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      <FieldError message={error} />
    </Field>
  );
}
