"use client";

import type { VariantProps } from "class-variance-authority";
import { LoaderCircle } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { iconButtonVariants } from "./button-variants";

type IconButtonProps = Omit<ComponentProps<"button">, "children" | "aria-label"> &
  VariantProps<typeof iconButtonVariants> & {
    label: string;
    loading?: boolean;
    children: ReactNode;
  };

export function IconButton({
  label,
  className,
  variant,
  size,
  loading = false,
  disabled,
  children,
  type = "button",
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      className={cn(iconButtonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <LoaderCircle className="motion-safe:animate-spin" aria-hidden="true" />
      ) : (
        children
      )}
    </button>
  );
}
