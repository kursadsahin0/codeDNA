import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type StateFrameProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  role?: "status" | "alert";
  heading?: "h1" | "h2" | "h3";
  tone?: "neutral" | "danger";
  className?: string;
};

export function StateFrame({
  icon,
  title,
  description,
  action,
  role,
  heading = "h2",
  tone = "neutral",
  className,
}: StateFrameProps) {
  const Title = heading;

  return (
    <div
      role={role}
      className={cn(
        "mx-auto flex w-full max-w-md flex-col items-center px-4 py-8 text-center",
        className,
      )}
    >
      {icon ? (
        <div
          className={cn(
            "mb-3 flex size-9 items-center justify-center border border-border bg-surface",
            tone === "danger" ? "text-danger-subtle-foreground" : "text-foreground-secondary",
          )}
        >
          {icon}
        </div>
      ) : null}
      <Title className="text-sm font-semibold text-foreground">{title}</Title>
      {description ? <p className="mt-1 text-sm text-foreground-secondary">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
