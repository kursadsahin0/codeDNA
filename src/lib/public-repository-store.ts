import type { AnalysisGraph } from "@/lib/analysis/types";

export type PublicRepositoryAnalysis = {
  repository: { name: string; url: string; branch: string; description: string | null };
  commits: {
    sha: string;
    subject: string;
    body?: string;
    author: string;
    authoredAt: string;
    url: string;
  }[];
  diagnostics?: { code: string; message: string; path?: string; severity: "warning" | "error" }[];
  analyzedCommit: string | null;
  commitSubject: string | null;
  status: "success" | "partial" | "failed";
  sourceFileCount: number;
  analyzedFileCount: number;
  skippedFileCount: number;
  errorCount: number;
  durationMs: number;
  truncated: boolean;
  graph: AnalysisGraph;
};

const storageKey = "codedna:public-repository-analysis";
export function loadPublicRepositoryAnalysis(): PublicRepositoryAnalysis | null {
  try {
    const value = sessionStorage.getItem(storageKey);
    if (!value || value.length > 5_000_000) return null;
    const data = JSON.parse(value) as PublicRepositoryAnalysis;
    if (
      !data.repository?.name ||
      !data.repository.url ||
      !Array.isArray(data.graph?.nodes) ||
      !Array.isArray(data.graph?.edges)
    )
      return null;
    return data;
  } catch {
    return null;
  }
}
export function clearPublicRepositoryAnalysis() {
  try {
    sessionStorage.removeItem(storageKey);
    window.dispatchEvent(new Event("codedna:public-repository-change"));
  } catch {
    return false;
  }
  return true;
}

export function savePublicRepositoryAnalysis(value: PublicRepositoryAnalysis) {
  try {
    sessionStorage.setItem(storageKey, JSON.stringify(value));
    window.dispatchEvent(new Event("codedna:public-repository-change"));
    return true;
  } catch {
    return false;
  }
}
