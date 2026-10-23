import type { AnalysisGraph, AnalysisNode } from "@/lib/analysis/types";
import { findImportCycles } from "@/lib/impact/analysis.mjs";

const cyclesIn = findImportCycles as (graph: AnalysisGraph) => string[][];

export type FanInLeader = {
  path: string;
  importers: string[];
};

export type ExternalPackage = {
  name: string;
  files: string[];
};

export type UnresolvedImport = {
  from: string;
  specifier: string;
};

export type GraphSummary = {
  fileCount: number;
  importCount: number;
  symbolCount: number;
  exportedSymbolCount: number;
  directoryCount: number;
  fileTypes: { type: string; count: number }[];
  directories: { path: string; files: number }[];
  leaders: FanInLeader[];
  externals: ExternalPackage[];
  unresolved: UnresolvedImport[];
  cycles: { paths: string[] }[];
  entries: string[];
  isolated: string[];
};

function directoryOf(path: string) {
  const index = path.lastIndexOf("/");
  return index < 0 ? "." : path.slice(0, index);
}

function labelOf(node: AnalysisNode | undefined, fallback: string) {
  return node?.path ?? node?.name ?? fallback;
}

export function summarizeGraph(graph: AnalysisGraph): GraphSummary {
  const nodes = new Map(graph.nodes.map((node) => [node.id, node]));
  const files = graph.nodes.filter((node) => node.kind === "file");
  const imports = graph.edges.filter((edge) => edge.kind === "import");
  const symbols = graph.nodes.filter((node) => node.kind === "function" || node.kind === "class");

  const fileTypes = new Map<string, number>();
  const directories = new Map<string, number>();
  for (const file of files) {
    const type = file.fileType ?? "unknown";
    fileTypes.set(type, (fileTypes.get(type) ?? 0) + 1);
    const directory = directoryOf(file.path ?? file.name);
    directories.set(directory, (directories.get(directory) ?? 0) + 1);
  }

  const importers = new Map<string, string[]>();
  const outbound = new Map<string, number>();
  const externals = new Map<string, Set<string>>();
  const unresolved: UnresolvedImport[] = [];

  for (const edge of imports) {
    const source = nodes.get(edge.source);
    const target = nodes.get(edge.target);
    const from = labelOf(source, edge.source);
    if (source?.kind === "file") {
      outbound.set(source.id, (outbound.get(source.id) ?? 0) + 1);
    }
    if (target?.kind === "file") {
      const list = importers.get(target.id) ?? [];
      list.push(from);
      importers.set(target.id, list);
    }
    if (target?.external) {
      const users = externals.get(target.name) ?? new Set<string>();
      users.add(from);
      externals.set(target.name, users);
    }
    if (edge.confidence === "unknown") {
      unresolved.push({ from, specifier: edge.specifier ?? target?.name ?? edge.target });
    }
  }

  const leaders = files
    .map((file) => ({
      path: file.path ?? file.name,
      importers: [...(importers.get(file.id) ?? [])].sort(),
    }))
    .filter((item) => item.importers.length > 0)
    .sort((a, b) => b.importers.length - a.importers.length || a.path.localeCompare(b.path));

  const cycles = cyclesIn(graph).map((component) => ({
    paths: component.map((id) => labelOf(nodes.get(id), id)).sort((a, b) => a.localeCompare(b)),
  }));

  const entries = files
    .filter(
      (file) => (importers.get(file.id)?.length ?? 0) === 0 && (outbound.get(file.id) ?? 0) > 0,
    )
    .map((file) => file.path ?? file.name)
    .sort();

  const isolated = files
    .filter(
      (file) => (importers.get(file.id)?.length ?? 0) === 0 && (outbound.get(file.id) ?? 0) === 0,
    )
    .map((file) => file.path ?? file.name)
    .sort();

  return {
    fileCount: files.length,
    importCount: imports.length,
    symbolCount: symbols.length,
    exportedSymbolCount: symbols.filter((node) => node.exported).length,
    directoryCount: directories.size,
    fileTypes: [...fileTypes.entries()]
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count || a.type.localeCompare(b.type)),
    directories: [...directories.entries()]
      .map(([path, count]) => ({ path, files: count }))
      .sort((a, b) => b.files - a.files || a.path.localeCompare(b.path)),
    leaders,
    externals: [...externals.entries()]
      .map(([name, users]) => ({ name, files: [...users].sort() }))
      .sort((a, b) => b.files.length - a.files.length || a.name.localeCompare(b.name)),
    unresolved,
    cycles,
    entries,
    isolated,
  };
}
