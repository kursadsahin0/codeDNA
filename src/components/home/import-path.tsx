import { ChevronRight } from "lucide-react";
import { kindLabel, nodeById, type NodeKind } from "@/lib/demo/harbor";
import { cn } from "@/lib/utils";

const path = ["index", "server", "listener", "http"] as const;

const swatch: Record<NodeKind, string> = {
  entry: "bg-graph-entry",
  file: "bg-graph-file",
  module: "bg-graph-module",
  external: "bg-graph-external",
};

/** One real import path through harbor: index → server → listener → node:http. */
export function ImportPath() {
  const nodes = path.map((id) => nodeById(id));

  return (
    <div className="rounded-md border border-border bg-surface">
      <div className="flex h-9 items-center border-b border-border px-3">
        <p className="font-mono text-xs text-foreground-secondary">Import path</p>
      </div>
      <ol className="flex flex-col gap-2 p-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-1.5">
        {nodes.map((node, index) => (
          <li key={node.id} className="flex items-center gap-1.5">
            {index > 0 ? (
              <ChevronRight
                className="hidden size-3.5 text-foreground-tertiary sm:block"
                aria-hidden="true"
              />
            ) : null}
            <span className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-2 font-mono text-xs text-foreground">
              <span className={cn("size-1.5 rounded-full", swatch[node.kind])} aria-hidden="true" />
              {node.path}
              <span className="text-foreground-tertiary">{kindLabel[node.kind]}</span>
            </span>
          </li>
        ))}
      </ol>
      <p className="border-t border-border px-3 py-2 text-xs text-foreground-secondary">
        src/index.ts reaches node:http only through src/server.ts and src/listener.ts.
      </p>
    </div>
  );
}
