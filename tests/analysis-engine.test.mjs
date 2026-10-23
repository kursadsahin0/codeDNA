import test from "node:test";
import assert from "node:assert/strict";
import { analyzeRepository } from "../src/lib/analysis/engine.mjs";

const files = (...items) => items.map(([path, content]) => ({ path, content }));

test("builds file and import edges for a simple import chain", () => {
  const result = analyzeRepository(files(["src/a.ts", 'import { b } from "./b"; export const a = () => b();'], ["src/b.ts", "export function b() { return 1; }"]));
  assert.equal(result.status, "success");
  assert.ok(result.graph.edges.some((edge) => edge.kind === "import" && edge.target === "file:src/b.ts" && edge.confidence === "certain"));
  assert.ok(result.graph.edges.some((edge) => edge.kind === "export" && edge.target === "function:src/b.ts#b"));
  assert.ok(result.graph.edges.some((edge) => edge.kind === "call" && edge.target === "function:src/b.ts#a" ) === false);
});

test("retains cyclic dependencies without recursion or dropping an edge", () => {
  const result = analyzeRepository(files(["a.ts", 'import "./b";'], ["b.ts", 'import "./a";']));
  assert.equal(result.graph.edges.filter((edge) => edge.kind === "import").length, 2);
});

test("represents missing relative imports as unknown external modules", () => {
  const result = analyzeRepository(files(["src/main.ts", 'import "./missing";']));
  const edge = result.graph.edges.find((candidate) => candidate.kind === "import");
  assert.equal(edge.confidence, "unknown");
  assert.equal(edge.target, "module:external:./missing");
  assert.equal(result.status, "partial");
});

test("reports malformed syntax and still returns parsed graph data", () => {
  const result = analyzeRepository(files(["broken.ts", "export function broken( {\n"]));
  assert.ok(result.errorCount > 0);
  assert.equal(result.status, "partial");
});

test("resolves TypeScript path aliases from repository tsconfig", () => {
  const result = analyzeRepository(files(["tsconfig.json", '{"compilerOptions":{"baseUrl":".","paths":{"@/*":["src/*"]}}}'], ["src/main.ts", 'import { util } from "@/util";'], ["src/util.ts", "export const util = 1;"]));
  assert.ok(result.graph.edges.some((edge) => edge.kind === "import" && edge.target === "file:src/util.ts" && edge.confidence === "certain"));
});

test("skips files over the configured hard size limit", () => {
  const result = analyzeRepository(files(["large.ts", "x".repeat(1024 * 1024 + 1)]));
  assert.equal(result.analyzedFileCount, 0);
  assert.equal(result.skippedFileCount, 1);
  assert.equal(result.status, "failed");
});

test("skips unsupported languages", () => {
  const result = analyzeRepository(files(["main.py", "print('not parsed')"]));
  assert.equal(result.skippedFileCount, 1);
  assert.equal(result.graph.nodes.length, 0);
});

test("rejects unsafe repository paths", () => {
  const result = analyzeRepository(files(["../escape.ts", "export const bad = true;"], ["safe.ts", "export const safe = true;"]));
  assert.ok(result.diagnostics.some((diagnostic) => diagnostic.code === "unsafe_path"));
  assert.ok(!result.graph.nodes.some((node) => node.path?.includes("escape")));
});

test("does not confuse import declarations with call edges", () => {
  const result = analyzeRepository(files(["main.ts", 'import { run } from "./other"; run();'], ["other.ts", "export function run() {}"]));
  assert.ok(result.graph.edges.some((edge) => edge.kind === "import"));
  assert.ok(!result.graph.edges.some((edge) => edge.kind === "call" && edge.target === "function:other.ts#run"));
});
