"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Search, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { loadPublicRepositoryAnalysis, type PublicRepositoryAnalysis } from "@/lib/public-repository-store";
import { analyzeChangeImpact } from "@/lib/impact/analysis.mjs";
import type { ImpactAnalysis } from "@/lib/impact/types";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

const analyze = analyzeChangeImpact as (graph: NonNullable<PublicRepositoryAnalysis>["graph"], selectedId: string, options?: { maxDepth?: number }) => ImpactAnalysis;

export function ChangeImpactExplorer() {
  const [analysis, setAnalysis] = useState<PublicRepositoryAnalysis | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [depth, setDepth] = useState(5);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  useEffect(() => {
    const update = () => setAnalysis(loadPublicRepositoryAnalysis());
    update();
    window.addEventListener("codedna:public-repository-change", update);
    window.addEventListener("storage", update);
    return () => { window.removeEventListener("codedna:public-repository-change", update); window.removeEventListener("storage", update); };
  }, []);
  const graph = analysis?.graph;
  const available = useMemo(() => graph?.nodes.filter((node) => node.kind === "file" || node.kind === "function" || node.kind === "class") ?? [], [graph]);
  const selectedNodeId = available.some((node) => node.id === selectedId) ? selectedId : available.find((node) => node.kind === "file")?.id ?? available[0]?.id ?? "";
  const result = useMemo(() => graph && selectedNodeId ? analyze(graph, selectedNodeId, { maxDepth: depth }) : null, [graph, selectedNodeId, depth]);
  const impacts = useMemo(() => (result?.impacts ?? []).filter((item) => (filter === "all" || filter === "direct" && item.direct || filter === "indirect" && !item.direct || filter === "cycles" && item.cycle) && (item.node.path ?? item.node.name).toLowerCase().includes(query.toLowerCase())).sort((a, b) => a.depth - b.depth || (a.node.path ?? a.node.name).localeCompare(b.node.path ?? b.node.name)), [result, filter, query]);

  if (!analysis) return <section className="rounded-lg border border-border bg-surface p-8 text-center"><ShieldAlert className="mx-auto size-6 text-foreground-tertiary" /><h2 className="mt-2 text-sm font-semibold">Analyze a repository to review change impact</h2><p className="mx-auto mt-1 max-w-md text-xs leading-5 text-foreground-secondary">The impact view uses the same public repository analysis as your overview and architecture map.</p><Link href="/repositories#public-repository" className={cn(buttonVariants(), "mt-4")}>Enter a repository link <ArrowRight className="size-4" /></Link></section>;

  return <div className="space-y-4"><div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface p-3"><div className="min-w-0 flex-1"><p className="truncate font-mono text-xs font-medium">{analysis.repository.name}</p><p className="mt-0.5 text-[11px] text-foreground-tertiary">Impact follows static import dependencies · branch {analysis.repository.branch}</p></div><Link href="/repositories#public-repository" className="text-xs text-accent hover:underline">Change repository</Link></div>
    <section className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_22rem]"><div className="rounded-lg border border-border bg-surface p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><label htmlFor="impact-target" className="text-[10px] font-medium uppercase tracking-wide text-foreground-tertiary">File or symbol to change</label><select id="impact-target" value={selectedNodeId} onChange={(event) => setSelectedId(event.target.value)} className="mt-1 block h-9 max-w-full rounded-md border border-border bg-background px-2.5 font-mono text-xs focus-ring">{available.map((node) => <option value={node.id} key={node.id}>{node.path ?? node.name}{node.kind !== "file" ? ` · ${node.kind}` : ""}</option>)}</select></div><label className="flex items-center gap-2 text-xs text-foreground-secondary">Depth <input aria-label="Maximum dependency depth" type="range" min="1" max="5" value={depth} onChange={(event) => setDepth(Number(event.target.value))} className="accent-primary" /><span>{depth}</span></label></div><p className="mt-3 text-xs leading-5 text-foreground-secondary">Static imports show possible affected paths. They do not establish runtime behavior or every effect of a change.</p></div><RiskSummary result={result} /></section>
    <section className="overflow-hidden rounded-lg border border-border bg-surface">
      <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
        <h2 className="text-sm font-semibold">Potentially affected files <span className="ml-1 text-foreground-tertiary">({impacts.length})</span></h2>
        <label className="relative ml-auto"><span className="sr-only">Search affected files</span><Search className="pointer-events-none absolute top-2 left-2 size-3.5 text-foreground-tertiary" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter files" className="h-8 w-44 rounded border border-border bg-background pl-7 pr-2 text-xs focus-ring" /></label>
        <select aria-label="Filter impact paths" value={filter} onChange={(event) => setFilter(event.target.value)} className="h-8 rounded border border-border bg-background px-2 text-xs focus-ring"><option value="all">All paths</option><option value="direct">Direct</option><option value="indirect">Indirect</option><option value="cycles">Cycles</option></select>
      </div>
      {impacts.length ? <ul className="divide-y divide-border">{impacts.map((item) => {
        const chain = item.chain.map((id) => {
          const node = graph?.nodes.find((entry) => entry.id === id);
          return node?.path ?? node?.name ?? id;
        }).join(" → ");
        return <li key={item.node.id} className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-surface-hover"><code className="min-w-0 flex-1 truncate text-xs">{item.node.path ?? item.node.name}</code><Badge variant={item.direct ? "info" : "outline"}>{item.direct ? "Direct" : `Depth ${item.depth}`}</Badge>{item.cycle ? <Badge variant="warning">Cycle</Badge> : null}<span className="w-full truncate text-[10px] text-foreground-tertiary">Chain: {chain}</span></li>;
      })}</ul> : <p className="p-5 text-xs text-foreground-secondary">No dependent files matched this selection and filter.</p>}
    </section>
    {result?.tests.length ? <section className="rounded-lg border border-border bg-surface p-4"><h2 className="text-sm font-semibold">Related test files</h2><p className="mt-1 text-xs text-foreground-secondary">These files match a test name and statically import a file in the affected set.</p><ul className="mt-2 divide-y divide-border">{result.tests.map((test) => <li key={test.node.id} className="py-2 font-mono text-xs">{test.node.path ?? test.node.name}</li>)}</ul></section> : null}
    <p className="flex items-start gap-2 rounded-md border border-border bg-background-subtle p-3 text-[11px] leading-5 text-foreground-secondary"><ShieldAlert className="mt-0.5 size-4 shrink-0 text-warning" /><span>The score is a rule-based review heuristic, not a defect probability. Commit churn and historical test coverage are unavailable in a public-link preview.</span></p>
  </div>;
}

function RiskSummary({ result }: { result: ImpactAnalysis | null }) {
  if (!result) return null;
  return <section className="rounded-lg border border-border bg-surface p-4"><p className="text-[10px] font-medium uppercase tracking-wide text-foreground-tertiary">Review signal score</p><p className="mt-1 text-3xl font-semibold tabular-nums">{result.risk.score}<span className="text-base text-foreground-tertiary">/100</span></p><div className="mt-3 space-y-2">{result.risk.signals.map((signal) => <details key={signal.id} className="border-t border-border pt-2"><summary className="cursor-pointer text-xs font-medium">{signal.label} <span className="float-right text-foreground-secondary">{signal.points} points</span></summary><p className="mt-1 text-[11px] leading-4 text-foreground-secondary">{signal.detail}</p></details>)}</div><p className="mt-3 text-[10px] leading-4 text-foreground-tertiary">No commit history is used for this preview.</p></section>;
}
