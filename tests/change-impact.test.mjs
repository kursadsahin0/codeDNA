import test from "node:test";
import assert from "node:assert/strict";
import { analyzeChangeImpact, findImportCycles } from "../src/lib/impact/analysis.mjs";

function graph(paths, pairs) {
  const nodes = paths.map((path) => ({ id: `file:${path}`, kind: "file", name: path.split("/").at(-1), path }));
  const edges = pairs.map(([from, to], index) => ({ id: `edge:${index}`, kind: "import", source: `file:${from}`, target: `file:${to}`, confidence: "certain" }));
  return { version: 1, nodes, edges };
}

test("reverse breadth-first traversal separates direct and indirect impacts", () => {
  const result = analyzeChangeImpact(graph(["a.ts", "b.ts", "c.ts", "isolated.ts"], [["a.ts", "b.ts"], ["b.ts", "c.ts"]]), "file:c.ts");
  assert.deepEqual(result.impacts.map((item) => [item.node.path, item.depth]), [["b.ts", 1], ["a.ts", 2]]);
  assert.equal(result.impacts[0].direct, true);
  assert.deepEqual(result.impacts[1].chain, ["file:a.ts", "file:b.ts", "file:c.ts"]);
});

test("respects the maximum traversal depth", () => {
  const result = analyzeChangeImpact(graph(["a.ts", "b.ts", "c.ts"], [["a.ts", "b.ts"], ["b.ts", "c.ts"]]), "file:c.ts", { maxDepth: 1 });
  assert.deepEqual(result.impacts.map((item) => item.node.path), ["b.ts"]);
});

test("detects an affected dependency cycle without looping traversal", () => {
  const result = analyzeChangeImpact(graph(["a.ts", "b.ts", "c.ts"], [["a.ts", "b.ts"], ["b.ts", "a.ts"], ["c.ts", "b.ts"]]), "file:a.ts");
  assert.equal(result.cycles.length, 1);
  assert.equal(result.impacts.find((item) => item.node.path === "b.ts")?.cycle, true);
  assert.equal(findImportCycles(graph(["a.ts", "b.ts"], [["a.ts", "b.ts"], ["b.ts", "a.ts"]])).length, 1);
});

test("does not include unreachable files", () => {
  const result = analyzeChangeImpact(graph(["entry.ts", "changed.ts", "other.ts"], [["entry.ts", "changed.ts"]]), "file:changed.ts");
  assert.deepEqual(result.impacts.map((item) => item.node.path), ["entry.ts"]);
});

test("returns an empty result for an empty graph or missing selection", () => {
  assert.equal(analyzeChangeImpact({ version: 1, nodes: [], edges: [] }, "missing").status, "empty");
  assert.equal(analyzeChangeImpact(graph(["a.ts"], []), "missing").impacts.length, 0);
});

test("maps a selected function to its containing file for import impact", () => {
  const input = graph(["src/core.ts", "src/app.ts"], [["src/app.ts", "src/core.ts"]]);
  input.nodes.push({ id: "function:src/core.ts#run", kind: "function", name: "run", path: "src/core.ts" });
  const result = analyzeChangeImpact(input, "function:src/core.ts#run");
  assert.equal(result.changedFile.path, "src/core.ts");
  assert.deepEqual(result.impacts.map((item) => item.node.path), ["src/app.ts"]);
});
