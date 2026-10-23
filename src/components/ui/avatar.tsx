"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const tones = [
  "bg-primary-subtle text-primary-subtle-foreground",
  "bg-info-subtle text-info-subtle-foreground",
  "bg-success-subtle text-success-subtle-foreground",
  "bg-warning-subtle text-warning-subtle-foreground",
  "bg-accent-subtle text-accent",
] as const;

const sizes = {
  sm: "size-6 text-[10px]",
  md: "size-8 text-xs",
  lg: "size-10 text-sm",
} as const;

type AvatarProps = {
  name: string;
  src?: string;
  size?: keyof typeof sizes;
  labelled?: boolean;
  className?: string;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  const value = `${first}${last}`.toUpperCase();
  return value || "?";
}

function toneFor(name: string) {
  let hash = 0;
  for (const char of name) {
    hash = (hash + char.charCodeAt(0)) % tones.length;
  }
  return tones[hash] ?? tones[0];
}

export function Avatar({ name, src, size = "md", labelled = true, className }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;

  return (
    <span
      role={labelled ? "img" : undefined}
      aria-label={labelled ? name : undefined}
      aria-hidden={labelled ? undefined : true}
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-medium",
        sizes[size],
        showImage ? "bg-surface-active" : toneFor(name),
        className,
      )}
    >
      {showImage ? (
        // The accessible name lives on the parent.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="size-full object-cover" onError={() => setFailed(true)} />
      ) : (
        <span aria-hidden="true">{initials(name)}</span>
      )}
    </span>
  );
}
