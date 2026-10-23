"use client";

import { MotionConfig } from "motion/react";
import { useEffect, type ReactNode } from "react";
import { ToastProvider } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { baseTransition } from "@/lib/motion";
import { syncSystemTheme } from "@/lib/theme";
import { LocaleProvider } from "./locale-provider";

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => syncSystemTheme();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return (
    <MotionConfig reducedMotion="user" transition={baseTransition}>
      <LocaleProvider>
        <TooltipProvider>
          <ToastProvider>{children}</ToastProvider>
        </TooltipProvider>
      </LocaleProvider>
    </MotionConfig>
  );
}
