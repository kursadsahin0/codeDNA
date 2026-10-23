export type AnalysisStatus = "success" | "partial" | "failed";
export type GraphNodeKind = "file" | "module" | "function" | "class";
export type GraphEdgeKind = "import" | "export" | "call";

export interface AnalysisPosition { line: number; column: number; endLine: number; endColumn: number }
export interface AnalysisNode {
  id: string; kind: GraphNodeKind; name: string; path?: string; language?: "typescript" | "javascript";
  fileType?: string; position?: AnalysisPosition; exported?: boolean; external?: boolean;
}
export interface AnalysisEdge {
  id: string; kind: GraphEdgeKind; source: string; target: string;
  confidence: "certain" | "unknown"; specifier?: string;
}
export interface AnalysisDiagnostic { code: string; message: string; path?: string; severity: "warning" | "error" }
export interface AnalysisGraph { version: 1; nodes: AnalysisNode[]; edges: AnalysisEdge[] }
export interface AnalysisResult {
  status: AnalysisStatus; graph: AnalysisGraph; analyzedFileCount: number; skippedFileCount: number;
  errorCount: number; durationMs: number; diagnostics: AnalysisDiagnostic[]; parserVersion: string;
}
export interface ParserAdapter {
  readonly id: string;
  supports(path: string): boolean;
  analyze(files: Array<{ path: string; content: string; binary?: boolean; symlink?: boolean }>): AnalysisResult;
}
