"use client";

import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { motionDuration } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { IconButton } from "./icon-button";

export type ToastVariant = "default" | "success" | "warning" | "danger" | "info";

export type ToastInput = {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
};

type ToastRecord = Required<Pick<ToastInput, "title" | "variant" | "duration">> &
  Pick<ToastInput, "description"> & { id: string };

type ToastContextValue = {
  toast: (input: ToastInput) => string;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const icons = {
  default: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  danger: CircleAlert,
  info: Info,
} as const;

const iconTone = {
  default: "text-foreground-secondary",
  success: "text-success-subtle-foreground",
  warning: "text-warning-subtle-foreground",
  danger: "text-danger-subtle-foreground",
  info: "text-info-subtle-foreground",
} as const;

const accentBar = {
  default: "bg-border-strong",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
} as const;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback((input: ToastInput) => {
    const id = crypto.randomUUID();
    const next: ToastRecord = {
      id,
      title: input.title,
      description: input.description,
      variant: input.variant ?? "default",
      duration: input.duration ?? 5000,
    };
    setToasts((current) => [...current, next].slice(-4));
    return id;
  }, []);

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-label="Notifications"
        aria-live="polite"
        role="region"
        className="pointer-events-none fixed right-4 bottom-4 z-toast flex w-[min(100%-2rem,22rem)] flex-col gap-2"
      >
        <AnimatePresence initial={false}>
          {toasts.map((item) => (
            <ToastCard key={item.id} toast={item} onDismiss={dismiss} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ toast, onDismiss }: { toast: ToastRecord; onDismiss: (id: string) => void }) {
  const [paused, setPaused] = useState(false);
  const Icon = icons[toast.variant];

  useEffect(() => {
    if (paused) return;
    const timeout = window.setTimeout(() => onDismiss(toast.id), toast.duration);
    return () => window.clearTimeout(timeout);
  }, [onDismiss, paused, toast.duration, toast.id]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: motionDuration.slow }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        const next = event.relatedTarget;
        if (next instanceof Node && event.currentTarget.contains(next)) return;
        setPaused(false);
      }}
      className="pointer-events-auto flex overflow-hidden rounded-md border border-border bg-surface-raised shadow-overlay"
    >
      <span className={cn("w-0.5 shrink-0", accentBar[toast.variant])} aria-hidden="true" />
      <div className="flex min-w-0 flex-1 items-start gap-3 p-3">
        <Icon
          className={cn("mt-0.5 size-4 shrink-0", iconTone[toast.variant])}
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">{toast.title}</p>
          {toast.description ? (
            <p className="mt-1 text-sm text-foreground-secondary">{toast.description}</p>
          ) : null}
        </div>
        <IconButton label={`Dismiss ${toast.title}`} size="sm" onClick={() => onDismiss(toast.id)}>
          <X />
        </IconButton>
      </div>
    </motion.div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider.");
  }
  return context;
}
