"use client";

import { motion } from "motion/react";
import { useState } from "react";

const nodes = [
  { id: "queue", label: "queue/client.ts", x: 20, y: 28, kind: "module", summary: "Queue client used by API handlers and workers." },
  { id: "types", label: "jobs/types.ts", x: 50, y: 50, kind: "shared types", summary: "Job and queue payload types shared across the service." },
  { id: "worker", label: "worker/index.ts", x: 78, y: 25, kind: "module", summary: "Worker lifecycle and job dispatch." },
  { id: "retry", label: "worker/retry.ts", x: 78, y: 75, kind: "file", summary: "Retry policy used while a job is processed." },
  { id: "config", label: "config.ts", x: 20, y: 77, kind: "file", summary: "Service and queue configuration." },
] as const;
const edges = [["queue", "types"], ["worker", "types"], ["worker", "retry"], ["queue", "config"], ["worker", "config"]] as const;

export function KeelMap() {
  const [selectedId, setSelectedId] = useState<(typeof nodes)[number]["id"]>("types");
  const selected = nodes.find((node) => node.id === selectedId) ?? nodes[0];
  return <div className="overflow-hidden rounded-md border border-border bg-surface"><div className="grid lg:grid-cols-[minmax(0,1fr)_16rem]"><div className="overflow-x-auto border-b border-border lg:border-r lg:border-b-0"><div role="group" aria-label="keel dependency map" className="relative h-80 min-w-[34rem]"><svg aria-hidden="true" className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">{edges.map(([fromId, toId]) => { const from = nodes.find((node) => node.id === fromId)!; const to = nodes.find((node) => node.id === toId)!; const active = fromId === selectedId || toId === selectedId; return <line key={`${fromId}-${toId}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y} vectorEffect="non-scaling-stroke" strokeWidth={active ? 1.8 : 1} className={active ? "stroke-graph-dependency" : "stroke-border-strong"} />; })}</svg>{nodes.map((node, index) => <motion.button key={node.id} type="button" aria-pressed={selectedId === node.id} onClick={() => setSelectedId(node.id)} style={{ left: `${node.x}%`, top: `${node.y}%` }} initial={{ opacity: 0.6 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: index * 0.025 }} className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-md border bg-surface px-2 py-1.5 font-mono text-[11px] focus-ring ${selectedId === node.id ? "border-primary bg-primary-subtle text-primary-subtle-foreground" : "border-border-strong text-foreground"}`}>{node.label}</motion.button>)}</div></div><aside aria-live="polite" className="p-4"><p className="font-mono text-xs text-foreground-tertiary">Selected module</p><h2 className="mt-2 break-all font-mono text-sm font-medium">src/{selected.label}</h2><p className="mt-1 text-xs text-foreground-secondary">{selected.kind}</p><p className="mt-3 text-sm leading-5 text-foreground-secondary">{selected.summary}</p><p className="mt-4 border-t border-border pt-3 text-xs text-foreground-tertiary">{edges.filter(([from, to]) => from === selectedId || to === selectedId).length} direct relationships in this fixture</p></aside></div><p className="border-t border-border px-3 py-2 text-xs text-foreground-tertiary">Synthetic dependency relationships for the keel job queue fixture.</p></div>;
}
