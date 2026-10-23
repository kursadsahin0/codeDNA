import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { BreadcrumbItem } from "@/lib/navigation";

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
  label?: string;
  className?: string;
};

export function Breadcrumbs({ items, label = "Breadcrumb", className }: BreadcrumbsProps) {
  return (
    <nav aria-label={label} className={className}>
      <ol className="flex min-w-0 items-center gap-1.5">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-1.5">
              {index > 0 ? (
                <ChevronRight
                  className="size-3.5 shrink-0 text-foreground-tertiary"
                  aria-hidden="true"
                />
              ) : null}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="truncate rounded-sm text-sm text-foreground-secondary focus-ring hover:text-foreground"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className="truncate text-sm text-foreground"
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
