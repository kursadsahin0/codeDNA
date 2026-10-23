"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type RevealProps = {
  children: ReactNode;
  className?: string;
};

/** Progressive scroll reveal with identical server/client markup and reduced-motion support. */
export function Reveal({ children, className }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    if (element.getBoundingClientRect().top >= window.innerHeight * 0.92) element.dataset.reveal = "pending";

    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        element.dataset.reveal = "visible";
        observer.disconnect();
      }
    }, { rootMargin: "0px 0px -8% 0px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return <div ref={ref} data-reveal="visible" className={cn("transition-[opacity,transform] duration-300 ease-standard motion-reduce:transition-none", className)}>{children}</div>;
}
