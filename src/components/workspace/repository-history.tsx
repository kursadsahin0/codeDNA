"use client";

import { useState } from "react";
import type { RepositorySummary } from "@/lib/repositories/types";
import { cn } from "@/lib/utils";

export function RepositoryHistory({ repository }: { repository: RepositorySummary }) {
  const [hash, setHash] = useState(repository.commits[0]?.hash ?? "");
  const selected = repository.commits.find((commit) => commit.hash === hash) ?? repository.commits[0];
  if (!selected) return <p className="rounded-md border border-dashed border-border p-6 text-sm text-foreground-secondary">No commit samples are available.</p>;
  return <div className="grid overflow-hidden rounded-md border border-border bg-surface md:grid-cols-[18rem_minmax(0,1fr)]"><ol aria-label="Sample commits" className="border-b border-border md:border-r md:border-b-0">{repository.commits.map((commit) => <li key={commit.hash} className="border-b border-border last:border-b-0"><button type="button" aria-pressed={commit.hash === selected.hash} onClick={() => setHash(commit.hash)} className={cn("flex w-full flex-col gap-0.5 px-3 py-3 text-left focus-ring transition-control hover:bg-surface-hover", commit.hash === selected.hash && "bg-primary-subtle")}><span className="font-mono text-[11px] text-foreground-tertiary">{commit.hash} · {commit.time}</span><span className="text-sm text-foreground">{commit.subject}</span></button></li>)}</ol><section aria-live="polite" className="p-4"><p className="font-mono text-xs text-foreground-tertiary">{selected.hash} · {selected.author}</p><h2 className="mt-1 text-sm font-medium">{selected.subject}</h2><p className="mt-2 text-sm text-foreground-secondary">Files included in this sample change:</p><ul className="mt-3 space-y-1.5">{selected.files.map((file) => <li key={file} className="rounded-sm border border-border bg-background-subtle px-2 py-1.5 font-mono text-xs">{file}</li>)}</ul></section></div>;
}
