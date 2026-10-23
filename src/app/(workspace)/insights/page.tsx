"use client";

import Link from "next/link";
import { useMemo, type ReactNode } from "react";
import { ArrowRight, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { PageHeader } from "@/components/ui/page-header";
import { usePublicRepositoryAnalysis } from "@/components/workspace/use-public-analysis";
import { summarizeGraph } from "@/lib/analysis/summary";
import { cn } from "@/lib/utils";

export default function InsightsPage() {
  const analysis = usePublicRepositoryAnalysis();
  const summary = useMemo(() => (analysis ? summarizeGraph(analysis.graph) : null), [analysis]);
  const diagnostics = analysis?.diagnostics ?? [];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Codebase insights"
        title="Structural signals"
        description="Cycles, unresolved imports, and shared files come from the static graph of the analyzed sample. They are prompts for reading the code, not quality scores."
      />
      {!analysis || !summary ? (
        <section className="rounded-lg border border-border bg-surface p-8 text-center">
          <TriangleAlert className="mx-auto size-6 text-foreground-tertiary" />
          <h2 className="mt-2 text-sm font-semibold">Analyze a repository to see its insights</h2>
          <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-foreground-secondary">
            Insights use the same public repository sample as the overview and the architecture map.
          </p>
          <Link href="/repositories#public-repository" className={cn(buttonVariants(), "mt-4")}>
            Enter a repository link <ArrowRight className="size-4" />
          </Link>
        </section>
      ) : (
        <>
          <p className="rounded-md border border-border bg-surface px-3 py-2 font-mono text-xs">
            {analysis.repository.name} · {summary.fileCount} files · {summary.importCount} imports ·{" "}
            {summary.cycles.length} cycles · {summary.unresolved.length} unresolved
          </p>

          <SignalBlock
            title="Import cycles"
            empty="No cyclic import group was found among the analyzed files."
            items={summary.cycles.map((cycle) => (
              <li key={cycle.paths.join(">")} className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-medium">Cycle of {cycle.paths.length} files</h3>
                  <Badge variant="warning">Review</Badge>
                </div>
                <ol className="mt-2 flex flex-col gap-1">
                  {cycle.paths.map((path, index) => (
                    <li key={path} className="font-mono text-xs text-foreground-secondary">
                      {index + 1}. {path}
                    </li>
                  ))}
                </ol>
              </li>
            ))}
          />

          <SignalBlock
            title="Unresolved imports"
            empty="Every recorded import specifier resolved to an analyzed file or an external package name."
            items={summary.unresolved.map((item) => (
              <li key={`${item.from}:${item.specifier}`} className="px-4 py-3">
                <p className="font-mono text-xs text-foreground">{item.from}</p>
                <p className="mt-1 text-xs text-foreground-secondary">
                  Could not resolve <code>{item.specifier}</code>
                </p>
              </li>
            ))}
          />

          <SignalBlock
            title="Shared files"
            empty="No file in this sample is imported by two or more analyzed files."
            items={summary.leaders
              .filter((item) => item.importers.length >= 2)
              .map((item) => (
                <li key={item.path} className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-mono text-sm font-medium">{item.path}</h3>
                    <Badge variant="info">{item.importers.length} importers</Badge>
                  </div>
                  <ul className="mt-2 flex flex-col gap-1">
                    {item.importers.map((importer) => (
                      <li key={importer} className="font-mono text-xs text-foreground-secondary">
                        {importer}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
          />

          <SignalBlock
            title="Parse notes"
            empty="The parser did not report syntax errors or skipped-file warnings for this sample."
            items={diagnostics.map((item, index) => (
              <li key={`${item.code}-${item.path ?? index}`} className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-medium">{item.code}</h3>
                  <Badge variant={item.severity === "error" ? "danger" : "warning"}>
                    {item.severity}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-foreground-secondary">{item.message}</p>
                {item.path ? (
                  <p className="mt-1 font-mono text-xs text-foreground-tertiary">{item.path}</p>
                ) : null}
              </li>
            ))}
          />

          <p className="text-xs leading-5 text-foreground-tertiary">
            {summary.isolated.length
              ? `${summary.isolated.length} analyzed ${summary.isolated.length === 1 ? "file has" : "files have"} no import edges in this sample. `
              : ""}
            The public analysis reads at most 24 source files, so a missing edge can mean the other
            file was outside the sample.
          </p>
        </>
      )}
    </div>
  );
}

function SignalBlock({
  title,
  empty,
  items,
}: {
  title: string;
  empty: string;
  items: ReactNode[];
}) {
  return (
    <section className="overflow-hidden rounded-md border border-border bg-surface">
      <h2 className="border-b border-border px-4 py-3 text-sm font-semibold">{title}</h2>
      {items.length ? (
        <ul className="divide-y divide-border">{items}</ul>
      ) : (
        <p className="px-4 py-3 text-sm text-foreground-secondary">{empty}</p>
      )}
    </section>
  );
}
