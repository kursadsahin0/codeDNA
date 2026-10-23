import { cn } from "@/lib/utils";

type MarkProps = {
  className?: string;
  title?: string;
};

export function Mark({ className, title }: MarkProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={cn("size-4 shrink-0", className)}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      aria-label={title}
    >
      <path
        d="M4 5H12M4 5V12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="square"
      />
      <circle cx="4" cy="5" r="1.7" className="fill-primary" />
      <circle cx="12" cy="5" r="1.35" fill="currentColor" />
      <circle cx="4" cy="12" r="1.35" fill="currentColor" />
    </svg>
  );
}
