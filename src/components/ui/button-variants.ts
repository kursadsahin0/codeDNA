import { cva } from "class-variance-authority";

const controlVariants = {
  primary: "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active",
  secondary:
    "bg-secondary text-secondary-foreground hover:bg-secondary-hover active:bg-secondary-active",
  outline:
    "border border-border-strong bg-surface text-foreground hover:bg-surface-hover active:bg-surface-active",
  ghost: "text-foreground hover:bg-surface-hover active:bg-surface-active",
  danger: "bg-danger text-danger-foreground hover:bg-danger-hover active:bg-danger-active",
} as const;

const controlBase =
  "focus-ring transition-control inline-flex items-center justify-center rounded-md font-medium select-none disabled:cursor-not-allowed disabled:border-transparent disabled:bg-secondary disabled:text-disabled [&_svg]:pointer-events-none [&_svg]:shrink-0";

export const buttonVariants = cva(`${controlBase} gap-2 whitespace-nowrap`, {
  variants: {
    variant: controlVariants,
    size: {
      sm: "h-8 px-2.5 text-xs [&_svg]:size-3.5",
      md: "h-9 px-3 text-sm [&_svg]:size-4",
      lg: "h-10 px-4 text-sm [&_svg]:size-4",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "md",
  },
});

export const iconButtonVariants = cva(`${controlBase} shrink-0`, {
  variants: {
    variant: controlVariants,
    size: {
      sm: "size-8 [&_svg]:size-3.5",
      md: "size-9 [&_svg]:size-4",
      lg: "size-10 [&_svg]:size-4",
    },
  },
  defaultVariants: {
    variant: "ghost",
    size: "md",
  },
});
