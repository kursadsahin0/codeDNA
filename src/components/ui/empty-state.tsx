import { Inbox } from "lucide-react";
import type { ReactNode } from "react";
import { StateFrame } from "./state-frame";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
  heading?: "h1" | "h2" | "h3";
  className?: string;
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  heading,
  className,
}: EmptyStateProps) {
  return (
    <StateFrame
      role="status"
      tone="neutral"
      heading={heading}
      className={className}
      title={title}
      description={description}
      action={action}
      icon={icon ?? <Inbox className="size-4" aria-hidden="true" />}
    />
  );
}
