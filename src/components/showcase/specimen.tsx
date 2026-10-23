import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SpecimenProps = {
  label?: string;
  children: ReactNode;
  className?: string;
};

export function Specimen({ label, children, className }: SpecimenProps) {
  return (
    <div className="overflow-hidden rounded-md border border-border bg-surface">
      {label ? (
        <div className="border-b border-border px-3 py-2 font-mono text-[11px] text-foreground-tertiary">
          {label}
        </div>
      ) : null}
      <div className={cn("p-4", className)}>{children}</div>
    </div>
  );
}
