import { TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { StateFrame } from "./state-frame";

type ErrorStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
  heading?: "h1" | "h2" | "h3";
  className?: string;
};

export function ErrorState({
  icon,
  title,
  description,
  action,
  heading,
  className,
}: ErrorStateProps) {
  return (
    <StateFrame
      role="alert"
      tone="danger"
      heading={heading}
      className={className}
      title={title}
      description={description}
      action={action}
      icon={icon ?? <TriangleAlert className="size-4" aria-hidden="true" />}
    />
  );
}
