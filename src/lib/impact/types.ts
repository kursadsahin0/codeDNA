import type { AnalysisGraph, AnalysisNode } from "@/lib/analysis/types";

export interface ImpactPath {
  node: AnalysisNode;
  depth: number;
  direct: boolean;
  chain: string[];
  cycle: boolean;
}

export interface ImpactAnalysis {
  status: "ready" | "empty";
  selectedNode: AnalysisNode | null;
  changedFile: AnalysisNode | null;
  impacts: ImpactPath[];
  cycles: string[][];
  tests: Array<{ node: AnalysisNode; confidence: "static-import" }>;
  maxDepth: number;
  risk: {
    score: number;
    scoreParts?: Record<string, number>;
    weights: Record<string, number>;
    signals: Array<{ id: string; label: string; value: number; points: number; detail: string; sourceNodeIds: string[] }>;
  };
}

export interface AnalysisSnapshot {
  id: string;
  analyzed_commit: string;
  commit_subject: string;
  graph: AnalysisGraph;
  changed_files: string[];
  created_at: string;
}
