"use client";

import { useMemo, useState } from "react";
import { CodeMap } from "@/components/graph/code-map";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { SearchInput } from "@/components/ui/search-input";
import { Skeleton } from "@/components/ui/skeleton";
import { harborNodes, isHarborNodeId, type HarborNode } from "@/lib/demo/harbor";
import { cn } from "@/lib/utils";

const previewStates = [
  { id: "map", label: "Map" },
  { id: "reading", label: "Reading" },
  { id: "empty", label: "Empty" },
  { id: "error", label: "Error" },
] as const;

type PreviewState = (typeof previewStates)[number]["id"];

export function DemoWorkspace({ initialFile }: { initialFile: string }) {
  const [query, setQuery] = useState("");
  const [preview, setPreview] = useState<PreviewState>("map");
  const [selectedId, setSelectedId] = useState(
    isHarborNodeId(initialFile) ? initialFile : "context",
  );

  const visible = useMemo(() => filterNodes(query), [query]);
  const activeId = visible.some((node) => node.id === selectedId) ? selectedId : visible[0]?.id;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <SearchInput
          label="Filter files"
          placeholder="Filter files"
          value={query}
          onValueChange={setQuery}
          className="w-full lg:max-w-xs"
        />
        <div role="radiogroup" aria-label="Workspace preview" className="flex flex-wrap gap-1">
          {previewStates.map((state) => {
            const checked = preview === state.id;
            return (
              <button
                key={state.id}
                type="button"
                role="radio"
                aria-checked={checked}
                onClick={() => setPreview(state.id)}
                className={cn(
                  "h-8 rounded-md px-2.5 text-xs font-medium focus-ring transition-control",
                  checked
                    ? "bg-primary-subtle text-primary-subtle-foreground"
                    : "text-foreground-secondary hover:bg-surface-hover hover:text-foreground",
                )}
              >
                {state.label}
              </button>
            );
          })}
        </div>
      </div>
      <p className="text-xs text-foreground-tertiary">
        Map, reading, empty, and error are local previews. Nothing is requested from a repository.
      </p>
      {preview === "reading" ? <ReadingState /> : null}
      {preview === "empty" ? (
        <EmptyState
          heading="h2"
          title="No files in this view"
          description="The harbor fixture still has its files. This preview shows the workspace before a fixture is open."
          action={
            <Button variant="outline" onClick={() => setPreview("map")}>
              Show the map
            </Button>
          }
        />
      ) : null}
      {preview === "error" ? (
        <ErrorState
          heading="h2"
          title="The fixture could not be read"
          description="This is a local preview. Retry restores the map. No repository was contacted."
          action={<Button onClick={() => setPreview("map")}>Retry</Button>}
        />
      ) : null}
      {preview === "map" && visible.length === 0 ? (
        <EmptyState
          heading="h2"
          title="No files match"
          description={`Nothing in harbor matches “${query}”.`}
          action={
            <Button variant="outline" onClick={() => setQuery("")}>
              Clear filter
            </Button>
          }
        />
      ) : null}
      {preview === "map" && visible.length > 0 && activeId ? (
        <CodeMap nodes={visible} selectedId={activeId} onSelect={setSelectedId} showImpact />
      ) : null}
    </div>
  );
}

function ReadingState() {
  return (
    <div role="status" className="rounded-md border border-border bg-surface p-3">
      <p className="sr-only">Reading the harbor fixture.</p>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <div className="flex h-80 flex-col justify-between">
          <Skeleton className="h-7 w-28" />
          <div className="flex justify-center gap-8">
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-7 w-24" />
          </div>
          <Skeleton className="h-7 w-32" />
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    </div>
  );
}

function filterNodes(query: string): HarborNode[] {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return [...harborNodes];
  }
  return harborNodes.filter((node) => {
    const haystack = [node.path, node.label, node.summary, ...node.functions]
      .join(" ")
      .toLowerCase();
    return haystack.includes(needle);
  });
}
