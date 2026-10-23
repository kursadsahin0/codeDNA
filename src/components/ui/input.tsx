"use client";

import { CircleAlert } from "lucide-react";
import { useId, type ComponentProps } from "react";
import { cn } from "@/lib/utils";

const fieldClassName =
  "focus-ring w-full rounded-md border border-border bg-surface px-3 text-foreground placeholder:text-foreground-tertiary disabled:cursor-not-allowed disabled:bg-background-subtle disabled:text-disabled aria-invalid:border-danger";

type InputProps = Omit<ComponentProps<"input">, "size"> & {
  label: string;
  hideLabel?: boolean;
  hint?: string;
  error?: string;
  fieldSize?: "sm" | "md";
};

export function Input({
  label,
  hideLabel = false,
  hint,
  error,
  fieldSize = "md",
  className,
  id,
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="w-full">
      <label
        htmlFor={inputId}
        className={cn(
          "mb-1.5 block text-xs font-medium text-foreground-secondary",
          hideLabel && "sr-only",
        )}
      >
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          fieldClassName,
          fieldSize === "sm" ? "h-8 text-xs" : "h-9 text-sm",
          className,
        )}
        {...props}
      />
      {hint ? (
        <p id={hintId} className="mt-1.5 text-xs text-foreground-tertiary">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p
          id={errorId}
          role="alert"
          className="mt-1.5 flex items-start gap-1.5 text-xs text-danger-subtle-foreground"
        >
          <CircleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}

export { fieldClassName };
