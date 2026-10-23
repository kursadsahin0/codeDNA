import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  level?: 1 | 2;
  className?: string;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  level = 1,
  className,
}: PageHeaderProps) {
  const Title = level === 1 ? "h1" : "h2";

  return (
    <header
      className={cn(
        "flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-start md:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <p className="font-mono text-[11px] tracking-[0.08em] text-foreground-tertiary uppercase">
            {eyebrow}
          </p>
        ) : null}
        <Title
          className={cn("text-2xl font-semibold tracking-tight text-foreground", eyebrow && "mt-1")}
        >
          {title}
        </Title>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground-secondary">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex w-full shrink-0 items-center gap-2 md:w-auto">{actions}</div>
      ) : null}
    </header>
  );
}
