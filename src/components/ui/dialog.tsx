"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { IconButton } from "./icon-button";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({
  className,
  children,
  variant = "default",
  ...props
}: ComponentProps<typeof DialogPrimitive.Content> & {
  variant?: "default" | "drawer";
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-dialog bg-overlay data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in" />
      <DialogPrimitive.Content
        className={cn(
          variant === "drawer"
            ? "fixed inset-y-0 left-0 z-dialog flex h-full w-60 max-w-[85vw] flex-col border-r border-border bg-background-subtle shadow-overlay data-[state=closed]:animate-drawer-out data-[state=open]:animate-drawer-in"
            : "fixed top-1/2 left-1/2 z-dialog w-[min(100%-2rem,32rem)] -translate-x-1/2 -translate-y-1/2 rounded-md border border-border bg-surface-raised p-5 shadow-overlay data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in",
          className,
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogHeader({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("mb-4 flex items-start justify-between gap-4", className)}>{children}</div>
  );
}

export function DialogTitle({ className, ...props }: ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn("text-base font-semibold tracking-tight text-foreground", className)}
      {...props}
    />
  );
}

export function DialogDescription({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn("mt-1 text-sm text-foreground-secondary", className)}
      {...props}
    />
  );
}

export function DialogFooter({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}>
      {children}
    </div>
  );
}

export function DialogCloseButton() {
  return (
    <DialogPrimitive.Close asChild>
      <IconButton label="Close" size="sm">
        <X />
      </IconButton>
    </DialogPrimitive.Close>
  );
}
