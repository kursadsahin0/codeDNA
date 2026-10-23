"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, GitBranch } from "lucide-react";
import { ArchitectureGraph } from "@/components/graph/architecture-graph";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { loadPublicRepositoryAnalysis, type PublicRepositoryAnalysis } from "@/lib/public-repository-store";
import { cn } from "@/lib/utils";

export function ArchitectureExplorer() {
  const [analysis, setAnalysis] = useState<PublicRepositoryAnalysis | null>(null);
  useEffect(() => {
    const update = () => setAnalysis(loadPublicRepositoryAnalysis());
    update();
    window.addEventListener("codedna:public-repository-change", update);
    window.addEventListener("storage", update);
    return () => { window.removeEventListener("codedna:public-repository-change", update); window.removeEventListener("storage", update); };
  }, []);

  if (!analysis) return <div className="rounded-lg border border-border bg-surface p-10 text-center"><GitBranch className="mx-auto size-7 text-foreground-tertiary" /><h2 className="mt-3 text-sm font-semibold">Analyze your repository to open its architecture</h2><p className="mx-auto mt-1 max-w-md text-xs leading-5 text-foreground-secondary">Paste a public GitHub repository link. CodeDNA will analyze its JavaScript and TypeScript files and use those results in this workspace.</p><Link href="/repositories#public-repository" className={cn(buttonVariants(), "mt-4")}>Enter a repository link <ArrowRight className="size-4" /></Link></div>;

  const importCount = analysis.graph.edges.filter((edge) => edge.kind === "import").length;
  return <div className="space-y-4">
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface p-3"><GitBranch className="size-4 shrink-0 text-foreground-tertiary" /><div className="min-w-0 flex-1"><a href={analysis.repository.url} target="_blank" rel="noreferrer" className="truncate font-mono text-xs font-medium hover:text-accent">{analysis.repository.name}</a><p className="mt-0.5 text-[11px] text-foreground-tertiary">Branch <code>{analysis.repository.branch}</code> · {analysis.analyzedFileCount} analyzed files · {importCount} import relationships</p></div><Badge variant={analysis.status === "success" ? "success" : analysis.status === "partial" ? "warning" : "danger"}>{analysis.status} analysis</Badge><Link href="/repositories#public-repository" className="text-xs text-accent hover:underline">Change repository</Link></div>
    <ArchitectureGraph graph={analysis.graph} htmlUrl={analysis.repository.url} commit={analysis.analyzedCommit ?? undefined} commitSubject={analysis.commitSubject ?? undefined} />
    <p className="text-xs text-foreground-tertiary">This is a static analysis of the public repository. Results are held in this browser tab session; runtime behavior and commit history are not inferred.</p>
  </div>;
}
