import { RISK_THRESHOLDS, RISK_WEIGHTS } from "./risk-config.mjs";

function fileForNode(node, nodes) {
  if (!node) return null;
  if (node.kind === "file") return node;
  return nodes.find((candidate) => candidate.kind === "file" && candidate.path === node.path) ?? null;
}

export function findImportCycles(graph) {
  const fileNodes = graph.nodes.filter((node) => node.kind === "file");
  const adjacency = new Map(fileNodes.map((node) => [node.id, []]));
  for (const edge of graph.edges) if (edge.kind === "import" && adjacency.has(edge.source) && adjacency.has(edge.target)) adjacency.get(edge.source).push(edge.target);
  let nextIndex = 0;
  const stack = [];
  const onStack = new Set();
  const index = new Map();
  const low = new Map();
  const components = [];
  const visit = (id) => {
    index.set(id, nextIndex); low.set(id, nextIndex++); stack.push(id); onStack.add(id);
    for (const target of adjacency.get(id) ?? []) {
      if (!index.has(target)) { visit(target); low.set(id, Math.min(low.get(id), low.get(target))); }
      else if (onStack.has(target)) low.set(id, Math.min(low.get(id), index.get(target)));
    }
    if (low.get(id) === index.get(id)) {
      const component = []; let member;
      do { member = stack.pop(); onStack.delete(member); component.push(member); } while (member !== id);
      if (component.length > 1 || (adjacency.get(id) ?? []).includes(id)) components.push(component.sort());
    }
  };
  for (const node of fileNodes) if (!index.has(node.id)) visit(node.id);
  return components;
}

export function analyzeChangeImpact(graph, selectedId, options = {}) {
  const maxDepth = Math.max(0, Math.min(options.maxDepth ?? RISK_THRESHOLDS.maxDepth, 20));
  const selectedNode = graph.nodes.find((node) => node.id === selectedId) ?? null;
  const changedFile = fileForNode(selectedNode, graph.nodes);
  if (!changedFile) return { selectedNode, changedFile: null, impacts: [], cycles: [], tests: [], risk: { score: 0, signals: [], weights: RISK_WEIGHTS }, maxDepth, status: "empty" };

  // Import edge source imports target; impact therefore walks incoming edges in reverse.
  const importers = new Map(graph.nodes.filter((node) => node.kind === "file").map((node) => [node.id, []]));
  for (const edge of graph.edges) if (edge.kind === "import" && importers.has(edge.target) && importers.has(edge.source)) importers.get(edge.target).push(edge.source);
  const distance = new Map([[changedFile.id, 0]]);
  const towardChange = new Map();
  const queue = [changedFile.id];
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const current = queue[cursor]; const depth = distance.get(current);
    if (depth >= maxDepth) continue;
    for (const importer of importers.get(current) ?? []) {
      if (distance.has(importer)) continue;
      distance.set(importer, depth + 1); towardChange.set(importer, current); queue.push(importer);
    }
  }

  const nodeMap = new Map(graph.nodes.map((node) => [node.id, node]));
  const impacts = [...distance.entries()].filter(([id]) => id !== changedFile.id).map(([id, depth]) => {
    const chain = [id]; let current = id;
    while (towardChange.has(current)) { current = towardChange.get(current); chain.push(current); }
    return { node: nodeMap.get(id), depth, direct: depth === 1, chain, cycle: false };
  }).filter((impact) => impact.node).sort((a, b) => a.depth - b.depth || (a.node.path ?? a.node.name).localeCompare(b.node.path ?? b.node.name));

  const cycles = findImportCycles(graph).filter((component) => component.includes(changedFile.id) || impacts.some((impact) => component.includes(impact.node.id)));
  const cycleIds = new Set(cycles.flat());
  for (const impact of impacts) impact.cycle = cycleIds.has(impact.node.id);

  const reachableFiles = new Set([changedFile.id, ...impacts.map((impact) => impact.node.id)]);
  const tests = graph.nodes.filter((node) => node.kind === "file" && /(?:\.test|\.spec)\.[cm]?[jt]sx?$|(?:^|\/)__tests__\//i.test(node.path ?? "") &&
    graph.edges.some((edge) => edge.kind === "import" && edge.source === node.id && reachableFiles.has(edge.target)))
    .map((node) => ({ node, confidence: "static-import" }));

  const directCount = impacts.filter((impact) => impact.direct).length;
  const impactedCount = impacts.length;
  const recentChanges = (options.recentChangedFiles ?? []).filter((path) => path === changedFile.path).length;
  const hasCycle = cycles.length > 0;
  const weights = options.weights ?? RISK_WEIGHTS;
  const scoreParts = {
    affectedFiles: Math.round(Math.min(1, impactedCount / RISK_THRESHOLDS.affectedFilesForMax) * weights.affectedFiles),
    directDependants: Math.round(Math.min(1, directCount / RISK_THRESHOLDS.directDependantsForMax) * weights.directDependants),
    cycle: hasCycle ? weights.cycle : 0,
    recentChurn: Math.round(Math.min(1, recentChanges / RISK_THRESHOLDS.recentChangesForMax) * weights.recentChurn),
    missingTests: tests.length ? 0 : weights.missingTests,
  };
  const signals = [
    { id: "affectedFiles", label: "Affected files", value: impactedCount, points: scoreParts.affectedFiles, detail: `${impactedCount} files are reachable through reverse import dependencies (depth ≤ ${maxDepth}).`, sourceNodeIds: impacts.map((impact) => impact.node.id) },
    { id: "directDependants", label: "Direct dependants", value: directCount, points: scoreParts.directDependants, detail: `${directCount} files import the selected file directly.`, sourceNodeIds: impacts.filter((impact) => impact.direct).map((impact) => impact.node.id) },
    { id: "cycle", label: "Dependency cycle", value: hasCycle ? cycles.length : 0, points: scoreParts.cycle, detail: hasCycle ? `${cycles.length} import cycle group${cycles.length === 1 ? "" : "s"} intersect the affected graph.` : "No import cycle was found in the affected graph.", sourceNodeIds: cycles.flat() },
    { id: "recentChurn", label: "Recent file changes", value: recentChanges, points: scoreParts.recentChurn, detail: `The selected file appears in ${recentChanges} of the recent stored commit analyses.`, sourceNodeIds: [changedFile.id] },
    { id: "missingTests", label: "Related test files", value: tests.length, points: scoreParts.missingTests, detail: tests.length ? `${tests.length} conventionally named test file${tests.length === 1 ? "" : "s"} statically imports an affected file.` : "No conventionally named test file importing an affected file was found.", sourceNodeIds: tests.map((test) => test.node.id) },
  ];
  return { selectedNode, changedFile, impacts, cycles, tests, risk: { score: Math.min(100, Object.values(scoreParts).reduce((sum, points) => sum + points, 0)), scoreParts, signals, weights }, maxDepth, status: "ready" };
}
