"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadPublicRepositoryAnalysis, type PublicRepositoryAnalysis } from "@/lib/public-repository-store";
import { cn } from "@/lib/utils";

export function RepositoryPicker({ compact = false }: { compact?: boolean }) {
  const [analysis, setAnalysis] = useState<PublicRepositoryAnalysis | null>(null);
  useEffect(() => {
    const update = () => setAnalysis(loadPublicRepositoryAnalysis());
    update();
    window.addEventListener("codedna:public-repository-change", update);
    window.addEventListener("storage", update);
    return () => { window.removeEventListener("codedna:public-repository-change", update); window.removeEventListener("storage", update); };
  }, []);
  return <div className={cn("flex min-w-0 items-center gap-2", compact && "w-full")}>
    <span className={cn("shrink-0 text-xs text-foreground-tertiary", compact && "sr-only")}>Repository</span>
    {analysis ? <span className="min-w-0 max-w-48 truncate rounded-md border border-border bg-surface px-2 py-1 text-xs font-medium text-foreground" title={analysis.repository.name}>{analysis.repository.name}</span> : <span className="truncate text-xs text-foreground-tertiary">No repository selected</span>}
    <Link href="/repositories#public-repository" className="shrink-0 rounded px-1.5 py-1 text-[11px] text-accent hover:bg-surface-hover focus-ring">{analysis ? "Change" : "Add"}</Link>
  </div>;
}
