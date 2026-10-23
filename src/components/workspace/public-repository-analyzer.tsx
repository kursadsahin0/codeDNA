"use client";

import { useState, type FormEvent } from "react";
import { LoaderCircle, SearchCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fieldClassName } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { savePublicRepositoryAnalysis, type PublicRepositoryAnalysis } from "@/lib/public-repository-store";

type Result = {
  repository: { name: string; url: string; branch: string; description: string | null };
  commits: { sha: string; subject: string; author: string; authoredAt: string; url: string }[];
  analyzedCommit: string | null;
  commitSubject: string | null;
  status: "success" | "partial" | "failed";
  sourceFileCount: number;
  analyzedFileCount: number;
  skippedFileCount: number;
  errorCount: number;
  truncated: boolean;
  graph: { nodes: { id: string; kind: string; name: string; path?: string }[]; edges: { id: string; kind: string; source: string; target: string; confidence: string }[] };
};

export function PublicRepositoryAnalyzer() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(""); setResult(null);
    try {
      const response = await fetch("/api/public-repository/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) });
      const body = await response.json();
      if (!response.ok) throw new Error(typeof body.error === "string" ? body.error : "Repository analysis failed.");
      const analysis = body as Result;
      setResult(analysis);
      if (!savePublicRepositoryAnalysis(analysis as PublicRepositoryAnalysis)) throw new Error("Analysis completed, but the browser could not keep the result for the workspace. Try a smaller repository.");
      router.push("/workspace");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Repository analysis failed.");
    } finally { setBusy(false); }
  }

  const files = result?.graph.nodes.filter((node) => node.kind === "file") ?? [];
  const imports = result?.graph.edges.filter((edge) => edge.kind === "import") ?? [];

  return <section id="public-repository" className="scroll-mt-20 space-y-4 rounded-md border border-border bg-surface p-4">
    <div className="flex items-start gap-3"><SearchCode className="mt-0.5 size-4 text-accent" /><div><h2 className="text-sm font-semibold">Analyze your public repository</h2><p className="mt-1 text-xs leading-5 text-foreground-secondary">Paste a public GitHub repository URL. No account is required. JavaScript and TypeScript are supported; the analysis opens in your workspace.</p></div></div>
    <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row"><label className="sr-only" htmlFor="public-repo-url">GitHub repository URL</label><input id="public-repo-url" type="url" required value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://github.com/owner/repository" className={`${fieldClassName} min-w-0 flex-1`} /><Button type="submit" disabled={busy}>{busy ? <LoaderCircle className="size-4 animate-spin" /> : <SearchCode className="size-4" />}{busy ? "Analyzing…" : "Analyze public repository"}</Button></form>
    {error ? <p role="alert" className="rounded-md border border-danger/30 bg-danger-subtle p-3 text-xs text-danger">{error}</p> : null}
    {result ? <div className="space-y-3 rounded-md border border-border bg-background p-4" aria-live="polite"><p className="text-sm font-medium">Analysis complete. Opening {result.repository.name} in your workspace…</p><p className="text-xs text-foreground-secondary">{result.analyzedFileCount} files · {imports.length} import relationships. This analysis remains available for this browser tab session.</p><ul className="max-h-32 overflow-auto text-xs text-foreground-tertiary">{files.slice(0, 8).map((file) => <li key={file.id} className="truncate py-1 font-mono">{file.path}</li>)}</ul></div> : null}
  </section>;
}

