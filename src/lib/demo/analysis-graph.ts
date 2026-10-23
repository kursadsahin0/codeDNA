import { harborEdges, harborNodes } from "@/lib/demo/harbor";
import type { AnalysisGraph } from "@/lib/analysis/types";

export const harborAnalysisGraph: AnalysisGraph = {
  version: 1,
  nodes: harborNodes.map((node) => node.kind === "external"
    ? { id: `module:external:${node.path}`, kind: "module", name: node.path, external: true }
    : { id: `file:${node.path}`, kind: "file", name: node.path.split("/").at(-1)!, path: node.path, language: "typescript", fileType: ".ts" }),
  edges: harborEdges.map((edge) => {
    const source = harborNodes.find((node) => node.id === edge.from)!;
    const target = harborNodes.find((node) => node.id === edge.to)!;
    return {
      id: edge.id,
      kind: "import",
      source: source.kind === "external" ? `module:external:${source.path}` : `file:${source.path}`,
      target: target.kind === "external" ? `module:external:${target.path}` : `file:${target.path}`,
      confidence: "certain",
      specifier: target.path,
    };
  }),
};
