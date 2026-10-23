"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { GitCommitHorizontal, Search } from "lucide-react";
import { loadPublicRepositoryAnalysis, type PublicRepositoryAnalysis } from "@/lib/public-repository-store";

export function RepositoryEvolutionTimeline() {
  const [analysis, setAnalysis] = useState<PublicRepositoryAnalysis | null>(null);
  const [query, setQuery] = useState("");
  const [selectedSha, setSelectedSha] = useState("");
  useEffect(() => {
    const update = () => { const value = loadPublicRepositoryAnalysis(); setAnalysis(value); setSelectedSha(value?.commits[0]?.sha ?? ""); };
    update();
    window.addEventListener("codedna:public-repository-change", update);
    window.addEventListener("storage", update);
    return () => { window.removeEventListener("codedna:public-repository-change", update); window.removeEventListener("storage", update); };
  }, []);
  const commits = useMemo(() => (analysis?.commits ?? []).filter((commit) => `${commit.subject} ${commit.author} ${commit.sha}`.toLowerCase().includes(query.toLowerCase())), [analysis, query]);
  const selected = analysis?.commits.find((commit) => commit.sha === selectedSha) ?? commits[0];
  if (!analysis) return <div className="rounded-lg border border-border bg-surface p-8 text-center"><GitCommitHorizontal className="mx-auto size-6 text-foreground-tertiary" /><h2 className="mt-2 text-sm font-semibold">Enter a repository link to see its commits</h2><p className="mx-auto mt-1 max-w-md text-xs leading-5 text-foreground-secondary">Commit metadata is loaded from the public repository along with its source analysis.</p><Link href="/repositories#public-repository" className="mt-3 inline-block text-xs text-accent hover:underline">Choose a repository</Link></div>;
  return <div className="space-y-4"><header className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface p-4"><div className="min-w-0 flex-1"><a className="truncate font-mono text-sm font-medium hover:text-accent" href={analysis.repository.url} target="_blank" rel="noreferrer">{analysis.repository.name}</a><p className="mt-1 text-xs text-foreground-tertiary">Recent commits on <code>{analysis.repository.branch}</code> · loaded from GitHub</p></div><Link href="/repositories#public-repository" className="text-xs text-accent hover:underline">Change repository</Link></header>
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]"><section className="overflow-hidden rounded-lg border border-border bg-surface"><div className="flex items-center gap-3 border-b border-border p-3"><h2 className="text-sm font-semibold">Recent commits</h2><label className="relative ml-auto"><span className="sr-only">Filter commits</span><Search className="pointer-events-none absolute top-2 left-2 size-3.5 text-foreground-tertiary" /><input className="h-8 w-44 rounded border border-border bg-background pl-7 pr-2 text-xs focus-ring" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter commits" /></label></div>{commits.length ? <ol className="divide-y divide-border">{commits.map((commit) => <li key={commit.sha}><button type="button" onClick={() => setSelectedSha(commit.sha)} aria-pressed={selected?.sha === commit.sha} className={`w-full p-4 text-left transition-colors hover:bg-surface-hover focus-ring ${selected?.sha === commit.sha ? "bg-primary-subtle" : ""}`}><span className="flex flex-wrap items-center gap-x-3 gap-y-1"><code className="text-[10px] text-foreground-tertiary">{commit.sha.slice(0, 10)}</code><time dateTime={commit.authoredAt} className="text-[10px] text-foreground-tertiary">{formatDate(commit.authoredAt)}</time><span className="text-[10px] text-foreground-tertiary">{commit.author}</span></span><span className="mt-1 block break-words text-sm font-medium">{commit.subject}</span></button></li>)}</ol> : <p className="p-6 text-center text-xs text-foreground-secondary">No commits matched this search.</p>}</section>
      <aside className="rounded-lg border border-border bg-surface p-4">{selected ? <><p className="text-[10px] font-medium uppercase tracking-wide text-foreground-tertiary">Selected commit</p><h2 className="mt-2 break-words text-sm font-semibold">{selected.subject}</h2><p className="mt-2 text-xs text-foreground-secondary">{selected.author}</p><time dateTime={selected.authoredAt} className="mt-1 block text-xs text-foreground-tertiary">{formatDate(selected.authoredAt)}</time>{selected.body ? <p className="mt-3 text-xs leading-5 whitespace-pre-wrap text-foreground-secondary">{selected.body}</p> : <p className="mt-3 text-xs text-foreground-tertiary">This commit summary has no additional message body.</p>}<a href={selected.url} target="_blank" rel="noreferrer" className="mt-4 inline-flex text-xs text-accent hover:underline">Open commit on GitHub</a></> : <p className="text-xs text-foreground-secondary">No commit selected.</p>}<p className="mt-4 border-t border-border pt-3 text-[11px] leading-5 text-foreground-tertiary">This public-link view loads up to 10 commit summaries. Historical architecture snapshots and changed-file diffs are not reconstructed.</p></aside></div>
  </div>;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(date);
}
