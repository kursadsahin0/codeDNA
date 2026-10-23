"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight, Boxes, FileCode2, GitBranch, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { PublicRepositoryAnalyzer } from "@/components/workspace/public-repository-analyzer";
import { usePublicRepositoryAnalysis } from "@/components/workspace/use-public-analysis";
import { summarizeGraph } from "@/lib/analysis/summary";

export function OverviewDashboard() {
  const analysis = usePublicRepositoryAnalysis();
  const summary = useMemo(() => (analysis ? summarizeGraph(analysis.graph) : null), [analysis]);

  if (!analysis || !summary) {
    return (
      <div className="space-y-5">
        <div className="rounded-lg border border-border bg-surface p-8 text-center">
          <h2 className="text-lg font-semibold">Start with your repository</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-foreground-secondary">
            Paste a public GitHub repository URL. CodeDNA reads its JavaScript and TypeScript files
            and keeps the graph in this browser tab. No account is needed.
          </p>
        </div>
        <PublicRepositoryAnalyzer />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="font-mono text-[11px] tracking-wider text-foreground-tertiary uppercase">
            Repository overview · Public link analysis
          </p>
          <h2 className="mt-1 truncate text-2xl font-semibold tracking-tight">
            {analysis.repository.name}
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-foreground-secondary">
            {analysis.repository.description ?? "Public GitHub repository"}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Badge
            variant={
              analysis.status === "success"
                ? "success"
                : analysis.status === "partial"
                  ? "warning"
                  : "danger"
            }
          >
            {analysis.status}
          </Badge>
          <a
            href={analysis.repository.url}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-accent hover:underline"
          >
            View on GitHub
          </a>
        </div>
      </header>

      <section aria-label="Repository metrics" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          icon={FileCode2}
          label="Analyzed files"
          value={summary.fileCount}
          detail={`${analysis.skippedFileCount} skipped${analysis.truncated ? " · sample is truncated" : ""}`}
        />
        <Metric
          icon={Boxes}
          label="Directories"
          value={summary.directoryCount}
          detail={`${summary.fileTypes.length} file types`}
        />
        <Metric
          icon={GitBranch}
          label="Import relationships"
          value={summary.importCount}
          detail={`${summary.unresolved.length} unresolved`}
        />
        <Metric
          icon={TriangleAlert}
          label="Import cycles"
          value={summary.cycles.length}
          detail={`${summary.symbolCount} functions and classes`}
        />
      </section>

      <section
        aria-labelledby="analysis-coverage-title"
        className="rounded-md border border-border bg-surface p-4"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 id="analysis-coverage-title" className="text-sm font-semibold">
              Analysis coverage
            </h3>
            <p className="mt-1 text-xs leading-5 text-foreground-secondary">
              Static results describe the files fetched from this branch. They do not execute the
              repository or infer runtime behavior.
            </p>
          </div>
          <Link
            href="/insights"
            className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
          >
            Review diagnostics <ArrowRight className="size-3.5" />
          </Link>
        </div>
        <dl className="mt-4 grid gap-3 border-t border-border pt-3 sm:grid-cols-3">
          <div>
            <dt className="text-[11px] text-foreground-tertiary">Source files fetched</dt>
            <dd className="mt-1 text-sm font-medium tabular-nums">
              {analysis.sourceFileCount.toLocaleString("en")}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] text-foreground-tertiary">Files included in graph</dt>
            <dd className="mt-1 text-sm font-medium tabular-nums">
              {analysis.analyzedFileCount.toLocaleString("en")}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] text-foreground-tertiary">
              Fetched files skipped by parser
            </dt>
            <dd className="mt-1 text-sm font-medium tabular-nums">
              {analysis.skippedFileCount.toLocaleString("en")}
            </dd>
          </div>
        </dl>
        {analysis.truncated || analysis.errorCount > 0 || analysis.diagnostics?.length ? (
          <div className="mt-3 rounded border border-warning/30 bg-warning-subtle px-3 py-2 text-xs leading-5 text-warning-subtle-foreground">
            <p className="font-medium">
              {analysis.truncated
                ? "This is a bounded sample."
                : "The analysis reported limitations."}
              {analysis.errorCount
                ? ` ${analysis.errorCount} analysis ${analysis.errorCount === 1 ? "error was" : "errors were"} reported.`
                : ""}
            </p>
            {analysis.diagnostics?.length ? (
              <ul className="mt-2 space-y-1">
                {analysis.diagnostics.slice(0, 3).map((item, index) => (
                  <li key={`${item.code}-${item.path ?? index}`}>
                    <span className="font-medium">{item.code}</span>
                    {item.path ? <code> · {item.path}</code> : null}: {item.message}
                  </li>
                ))}
                {analysis.diagnostics.length > 3 ? (
                  <li>And {analysis.diagnostics.length - 3} more notes on Structural signals.</li>
                ) : null}
              </ul>
            ) : null}
          </div>
        ) : (
          <p className="mt-3 rounded border border-border bg-background px-3 py-2 text-xs leading-5 text-foreground-secondary">
            No parser warnings were reported. A clean parse still represents static relationships in
            the fetched sample only.
          </p>
        )}
      </section>

      <div className="grid gap-3 lg:grid-cols-2">
        <CountTable
          title="File types"
          empty="No supported source files were analyzed."
          rows={summary.fileTypes.map((item) => ({
            key: item.type,
            label: item.type,
            value: String(item.count),
          }))}
        />
        <CountTable
          title="Directories"
          empty="Files sit at the repository root."
          rows={summary.directories.map((item) => ({
            key: item.path,
            label: item.path,
            value: `${item.files} ${item.files === 1 ? "file" : "files"}`,
          }))}
        />
      </div>

      <section className="overflow-hidden rounded-md border border-border bg-surface">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            <h3 className="text-sm font-semibold">Most imported files</h3>
            <p className="mt-0.5 text-xs text-foreground-tertiary">
              Each row lists the files that import it directly.
            </p>
          </div>
          <Link
            href="/architecture"
            className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
          >
            Open architecture map <ArrowRight className="size-3.5" />
          </Link>
        </div>
        {summary.leaders.length ? (
          <ul className="divide-y divide-border">
            {summary.leaders.slice(0, 8).map((item) => (
              <li key={item.path} className="px-4 py-3">
                <div className="flex min-w-0 items-baseline justify-between gap-3">
                  <code className="min-w-0 truncate text-xs">{item.path}</code>
                  <span className="shrink-0 text-xs text-foreground-secondary">
                    {item.importers.length} {item.importers.length === 1 ? "importer" : "importers"}
                  </span>
                </div>
                <p className="mt-1 truncate font-mono text-[11px] text-foreground-tertiary">
                  {item.importers.join(" · ")}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-4 text-xs text-foreground-secondary">
            No internal import relationships were resolved in the supported files.
          </p>
        )}
      </section>

      <div className="grid gap-3 lg:grid-cols-2">
        <NameList
          title="External packages"
          empty="No external import specifiers were found."
          items={summary.externals.slice(0, 12).map((item) => ({
            key: item.name,
            label: item.name,
            detail: `${item.files.length} ${item.files.length === 1 ? "file" : "files"}`,
          }))}
        />
        <NameList
          title="Entry files"
          empty="No file imports others without being imported itself."
          items={summary.entries.slice(0, 8).map((path) => ({ key: path, label: path }))}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href="/architecture" className={buttonVariants()}>
          Explore this repository <ArrowRight className="size-4" />
        </Link>
        <Link href="/impact" className={buttonVariants({ variant: "outline" })}>
          Review change impact
        </Link>
        <Link href="/insights" className={buttonVariants({ variant: "outline" })}>
          Open structural signals
        </Link>
      </div>
      <p className="text-xs leading-5 text-foreground-tertiary">
        Branch {analysis.repository.branch}
        {analysis.analyzedCommit ? ` · commit ${analysis.analyzedCommit.slice(0, 12)}` : ""}.
        Analysis read {analysis.analyzedFileCount} JavaScript or TypeScript files
        {typeof analysis.durationMs === "number" ? ` in ${analysis.durationMs} ms` : ""}. Results
        stay in this browser tab. Commit history on the history page is metadata only.
      </p>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof FileCode2;
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <article className="rounded-md border border-border bg-surface p-4">
      <div className="flex items-center gap-2 text-xs text-foreground-secondary">
        <Icon className="size-4" />
        {label}
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight tabular-nums">
        {value.toLocaleString("en")}
      </p>
      <p className="mt-1 text-[11px] text-foreground-tertiary">{detail}</p>
    </article>
  );
}

function CountTable({
  title,
  empty,
  rows,
}: {
  title: string;
  empty: string;
  rows: { key: string; label: string; value: string }[];
}) {
  return (
    <section className="overflow-hidden rounded-md border border-border bg-surface">
      <h3 className="border-b border-border px-4 py-3 text-sm font-semibold">{title}</h3>
      {rows.length ? (
        <ul className="divide-y divide-border">
          {rows.slice(0, 8).map((row) => (
            <li key={row.key} className="flex items-center justify-between gap-3 px-4 py-2">
              <code className="min-w-0 truncate text-xs">{row.label}</code>
              <span className="shrink-0 text-xs text-foreground-secondary tabular-nums">
                {row.value}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-4 py-3 text-xs text-foreground-secondary">{empty}</p>
      )}
    </section>
  );
}

function NameList({
  title,
  empty,
  items,
}: {
  title: string;
  empty: string;
  items: { key: string; label: string; detail?: string }[];
}) {
  return (
    <section className="overflow-hidden rounded-md border border-border bg-surface">
      <h3 className="border-b border-border px-4 py-3 text-sm font-semibold">{title}</h3>
      {items.length ? (
        <ul className="divide-y divide-border">
          {items.map((item) => (
            <li key={item.key} className="flex items-center justify-between gap-3 px-4 py-2">
              <code className="min-w-0 truncate text-xs">{item.label}</code>
              {item.detail ? (
                <span className="shrink-0 text-xs text-foreground-tertiary">{item.detail}</span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-4 py-3 text-xs text-foreground-secondary">{empty}</p>
      )}
    </section>
  );
}
