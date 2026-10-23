"use client";

import { motion } from "motion/react";
import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { easeStandard, motionDuration } from "@/lib/motion";
import {
  harborEdges,
  harborNodes,
  impactOf,
  importedBy,
  importsOf,
  kindLabel,
  nodeById,
  type HarborNode,
  type NodeKind,
} from "@/lib/demo/harbor";
import { cn } from "@/lib/utils";

const kindSwatch: Record<NodeKind, string> = {
  entry: "bg-graph-entry",
  file: "bg-graph-file",
  module: "bg-graph-module",
  external: "bg-graph-external",
};

const legend: { kind: NodeKind | "import"; label: string; swatch: string }[] = [
  { kind: "entry", label: "Entry", swatch: "bg-graph-entry" },
  { kind: "file", label: "File", swatch: "bg-graph-file" },
  { kind: "module", label: "Module", swatch: "bg-graph-module" },
  { kind: "external", label: "External", swatch: "bg-graph-external" },
  { kind: "import", label: "Import", swatch: "bg-graph-dependency" },
];

type CodeMapProps = {
  selectedId?: string;
  defaultSelectedId?: string;
  onSelect?: (id: string) => void;
  nodes?: readonly HarborNode[];
  showImpact?: boolean;
  className?: string;
};

export function CodeMap({
  selectedId,
  defaultSelectedId = "context",
  onSelect,
  nodes = harborNodes,
  showImpact = false,
  className,
}: CodeMapProps) {
  const [internalId, setInternalId] = useState(defaultSelectedId);
  const buttonRefs = useRef(new Map<string, HTMLButtonElement>());
  const selected = selectedId ?? internalId;
  const active = nodes.some((node) => node.id === selected) ? selected : nodes[0]?.id;
  const visible = new Set(nodes.map((node) => node.id));
  const edges = harborEdges.filter((edge) => visible.has(edge.from) && visible.has(edge.to));

  function select(id: string, focus = false) {
    if (selectedId === undefined) {
      setInternalId(id);
    }
    onSelect?.(id);
    if (focus) {
      buttonRefs.current.get(id)?.focus();
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, id: string) {
    const ordered = [...nodes].sort((a, b) => a.y - b.y || a.x - b.x);
    const index = ordered.findIndex((node) => node.id === id);
    let next = -1;
    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      next = Math.min(ordered.length - 1, index + 1);
    } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      next = Math.max(0, index - 1);
    } else if (event.key === "Home") {
      next = 0;
    } else if (event.key === "End") {
      next = ordered.length - 1;
    }
    if (next < 0 || next === index) {
      return;
    }
    event.preventDefault();
    const target = ordered[next];
    if (target) {
      select(target.id, true);
    }
  }

  if (!active) {
    return null;
  }

  const current = nodeById(active);
  const related = new Set<string>([
    active,
    ...importsOf(active).map((node) => node.id),
    ...importedBy(active).map((node) => node.id),
  ]);

  return (
    <motion.div
      initial={{ opacity: 0.72 }}
      animate={{ opacity: 1 }}
      transition={{ duration: motionDuration.base, ease: easeStandard }}
      className={cn("overflow-hidden rounded-md border border-border bg-surface", className)}
    >
      <div className="flex h-9 items-center gap-2 border-b border-border px-3">
        <span className="font-mono text-xs text-foreground-secondary">Architecture preview</span>
        <span className="text-foreground-tertiary" aria-hidden="true">
          /
        </span>
        <span className="min-w-0 truncate font-mono text-xs text-foreground">{current.path}</span>
        <Badge className="ml-auto shrink-0">Illustrative</Badge>
      </div>
      <div className="grid lg:grid-cols-[minmax(0,1fr)_17rem]">
        <div className="overflow-x-auto border-b border-border lg:border-r lg:border-b-0">
          <div
            role="group"
            aria-label="Illustrative repository dependency map"
            className="relative h-80 min-w-[40rem]"
          >
            <svg
              className="absolute inset-0 h-full w-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              {edges.map((edge) => {
                const from = nodeById(edge.from);
                const to = nodeById(edge.to);
                const hot = from.id === active || to.id === active;
                return (
                  <line
                    key={edge.id}
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    vectorEffect="non-scaling-stroke"
                    className={cn(
                      "fill-none [transition:stroke_var(--duration-fast)_var(--ease-standard)]",
                      hot ? "stroke-graph-dependency" : "stroke-border-strong",
                    )}
                    strokeWidth={hot ? 1.75 : 1}
                  />
                );
              })}
            </svg>
            {nodes.map((node, index) => {
              const isSelected = node.id === active;
              return (
                <motion.button
                  key={node.id}
                  ref={(element) => {
                    if (element) {
                      buttonRefs.current.set(node.id, element);
                    } else {
                      buttonRefs.current.delete(node.id);
                    }
                  }}
                  type="button"
                  aria-pressed={isSelected}
                  aria-label={`${node.path}, ${kindLabel[node.kind]}`}
                  onClick={() => select(node.id)}
                  onKeyDown={(event) => onKeyDown(event, node.id)}
                  style={{ left: `${node.x}%`, top: `${node.y}%` }}
                  initial={{ opacity: 0.65, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{
                    opacity: { duration: motionDuration.slow, delay: Math.min(index * 0.025, 0.2) },
                    scale: { duration: motionDuration.fast },
                    y: { duration: motionDuration.fast },
                  }}
                  className={cn(
                    "absolute z-10 flex h-7 -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-md border bg-surface px-2 font-mono text-[11px] text-foreground focus-ring transition-control",
                    node.kind === "external" && "border-dashed",
                    isSelected
                      ? "border-primary bg-primary-subtle"
                      : related.has(node.id)
                        ? "border-border-strong"
                        : "border-border text-foreground-secondary",
                  )}
                >
                  <span className={cn("size-1.5 shrink-0 rounded-full", kindSwatch[node.kind])} />
                  {node.label}
                </motion.button>
              );
            })}
          </div>
        </div>
        <Detail node={current} showImpact={showImpact} onSelect={(id) => select(id, true)} />
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 border-t border-border px-3 py-2">
        {legend.map((item) => (
          <li
            key={item.label}
            className="flex items-center gap-1.5 text-xs text-foreground-secondary"
          >
            <span className={cn("size-1.5 rounded-full", item.swatch)} aria-hidden="true" />
            {item.label}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

function Detail({
  node,
  showImpact,
  onSelect,
}: {
  node: HarborNode;
  showImpact: boolean;
  onSelect: (id: string) => void;
}) {
  const imports = importsOf(node.id);
  const callers = importedBy(node.id);
  const impact = showImpact ? impactOf(node.id) : null;

  return (
    <div className="flex flex-col gap-4 p-3" aria-live="polite">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="font-mono text-sm font-medium text-foreground">{node.path}</h2>
        </div>
        <p className="mt-1 text-xs text-foreground-tertiary">{kindLabel[node.kind]}</p>
        <p className="mt-2 text-sm leading-5 text-foreground-secondary">{node.summary}</p>
      </div>
      <DetailList
        title="Functions"
        empty="No functions in this package."
        items={node.functions.map((name) => (
          <li key={name} className="flex items-center gap-1.5 font-mono text-xs text-foreground">
            <span className="size-1.5 rounded-full bg-graph-function" aria-hidden="true" />
            {name}
          </li>
        ))}
      />
      <DetailList
        title="Imports"
        empty="Nothing imported."
        items={imports.map((item) => (
          <NodeLink key={item.id} node={item} onSelect={onSelect} />
        ))}
      />
      <DetailList
        title="Imported by"
        empty="No file imports this."
        items={callers.map((item) => (
          <NodeLink key={item.id} node={item} onSelect={onSelect} />
        ))}
      />
      {impact ? (
        <DetailList
          title="Reached if this file changes"
          empty="Nothing else imports this file."
          items={impact.reached.map((hit) => (
            <li key={hit.node.id}>
              <button
                type="button"
                onClick={() => onSelect(hit.node.id)}
                className="flex w-full items-baseline justify-between gap-2 rounded-sm py-0.5 text-left font-mono text-xs text-foreground focus-ring hover:text-accent"
              >
                <span>{hit.node.path}</span>
                <span className="shrink-0 text-[11px] text-foreground-tertiary">
                  {hit.depth === 1 ? "Direct" : `Depth ${hit.depth}`}
                </span>
              </button>
            </li>
          ))}
        />
      ) : null}
    </div>
  );
}

function DetailList({ title, empty, items }: { title: string; empty: string; items: ReactNode[] }) {
  return (
    <div>
      <h3 className="text-xs font-medium text-foreground">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-1 text-xs text-foreground-tertiary">{empty}</p>
      ) : (
        <ul className="mt-1.5 flex flex-col gap-1">{items}</ul>
      )}
    </div>
  );
}

function NodeLink({ node, onSelect }: { node: HarborNode; onSelect: (id: string) => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(node.id)}
        className="rounded-sm font-mono text-xs text-foreground focus-ring hover:text-accent"
      >
        {node.path}
      </button>
    </li>
  );
}
