export type NodeKind = "entry" | "file" | "module" | "external";

export type HarborNode = {
  id: string;
  label: string;
  path: string;
  kind: NodeKind;
  /** Center of the node, in percent of the map. */
  x: number;
  y: number;
  functions: readonly string[];
  summary: string;
};

export type HarborEdge = {
  id: string;
  from: string;
  to: string;
};

export type HarborCommit = {
  id: string;
  hash: string;
  subject: string;
  files: readonly string[];
};

export const harborRepository = {
  name: "harbor",
  description: "A small HTTP router written as the CodeDNA demo fixture.",
} as const;

/**
 * Synthetic package. Edges are imports: `from` imports `to`.
 * Positions are authored so those imports can be drawn without extra links.
 */
export const harborNodes: readonly HarborNode[] = [
  {
    id: "index",
    label: "index",
    path: "src/index.ts",
    kind: "entry",
    x: 16,
    y: 36,
    functions: ["createServer", "createRouter"],
    summary: "Package entry. Re-exports the server and the router.",
  },
  {
    id: "server",
    label: "server",
    path: "src/server.ts",
    kind: "file",
    x: 38,
    y: 20,
    functions: ["createServer", "listen"],
    summary: "Creates the server, attaches the router, and starts listening.",
  },
  {
    id: "router",
    label: "router",
    path: "src/router.ts",
    kind: "module",
    x: 38,
    y: 56,
    functions: ["createRouter", "addRoute"],
    summary: "Registers routes and runs middleware before a handler.",
  },
  {
    id: "listener",
    label: "listener",
    path: "src/listener.ts",
    kind: "file",
    x: 62,
    y: 20,
    functions: ["bind"],
    summary: "Binds the server to the Node.js HTTP module.",
  },
  {
    id: "route",
    label: "route",
    path: "src/route.ts",
    kind: "file",
    x: 62,
    y: 52,
    functions: ["defineRoute", "handle"],
    summary: "Matches a request path, builds context, and returns a handler.",
  },
  {
    id: "middleware",
    label: "middleware",
    path: "src/middleware.ts",
    kind: "module",
    x: 38,
    y: 84,
    functions: ["compose"],
    summary: "Composes middleware around the route handler.",
  },
  {
    id: "errors",
    label: "errors",
    path: "src/errors.ts",
    kind: "file",
    x: 16,
    y: 72,
    functions: ["HttpError"],
    summary: "HTTP error type used by the server and by routes.",
  },
  {
    id: "http",
    label: "node:http",
    path: "node:http",
    kind: "external",
    x: 84,
    y: 12,
    functions: [],
    summary: "Node.js HTTP module. It sits outside the package.",
  },
  {
    id: "match",
    label: "match",
    path: "src/match.ts",
    kind: "file",
    x: 84,
    y: 36,
    functions: ["compile", "matchPath"],
    summary: "Compiles path patterns and tests them against a URL.",
  },
  {
    id: "context",
    label: "context",
    path: "src/context.ts",
    kind: "module",
    x: 84,
    y: 68,
    functions: ["createContext"],
    summary: "Request context shared by the server, routes, and middleware.",
  },
  {
    id: "pattern",
    label: "path-to-regexp",
    path: "path-to-regexp",
    kind: "external",
    x: 84,
    y: 88,
    functions: [],
    summary: "External pattern compiler. It sits outside the package.",
  },
];

export const harborEdges: readonly HarborEdge[] = [
  { id: "index-server", from: "index", to: "server" },
  { id: "index-router", from: "index", to: "router" },
  { id: "server-router", from: "server", to: "router" },
  { id: "server-listener", from: "server", to: "listener" },
  { id: "server-context", from: "server", to: "context" },
  { id: "server-errors", from: "server", to: "errors" },
  { id: "listener-http", from: "listener", to: "http" },
  { id: "router-route", from: "router", to: "route" },
  { id: "router-middleware", from: "router", to: "middleware" },
  { id: "route-match", from: "route", to: "match" },
  { id: "route-context", from: "route", to: "context" },
  { id: "route-errors", from: "route", to: "errors" },
  { id: "middleware-context", from: "middleware", to: "context" },
  { id: "match-pattern", from: "match", to: "pattern" },
];

export const harborCommits: readonly HarborCommit[] = [
  {
    id: "c1",
    hash: "c4e1a28",
    subject: "Introduce request context",
    files: ["context", "server"],
  },
  {
    id: "c2",
    hash: "91ab304",
    subject: "Register routes from the package entry",
    files: ["router", "route", "index"],
  },
  {
    id: "c3",
    hash: "0df551a",
    subject: "Compile patterns with path-to-regexp",
    files: ["match", "pattern"],
  },
  {
    id: "c4",
    hash: "77c0e8b",
    subject: "Compose middleware before handling",
    files: ["middleware", "router"],
  },
  {
    id: "c5",
    hash: "b18d44f",
    subject: "Bind listen() to node:http",
    files: ["listener", "server", "http"],
  },
];

export const kindLabel: Record<NodeKind, string> = {
  entry: "Entry",
  file: "File",
  module: "Module",
  external: "External",
};

export function nodeById(id: string): HarborNode {
  const node = harborNodes.find((item) => item.id === id);
  if (!node) {
    throw new Error(`Unknown harbor node: ${id}`);
  }
  return node;
}

export function importsOf(id: string): HarborNode[] {
  return harborEdges.filter((edge) => edge.from === id).map((edge) => nodeById(edge.to));
}

export function importedBy(id: string): HarborNode[] {
  return harborEdges.filter((edge) => edge.to === id).map((edge) => nodeById(edge.from));
}

export type ImpactHit = {
  node: HarborNode;
  depth: number;
};

/** Files that import `id`, directly or through another importer. */
export function impactOf(id: string): {
  changed: HarborNode;
  reached: ImpactHit[];
  unaffected: HarborNode[];
} {
  const reverse = new Map<string, string[]>();
  for (const edge of harborEdges) {
    const list = reverse.get(edge.to) ?? [];
    list.push(edge.from);
    reverse.set(edge.to, list);
  }

  const depth = new Map<string, number>();
  const queue = (reverse.get(id) ?? []).map((from) => ({ id: from, depth: 1 }));

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || depth.has(current.id) || current.id === id) {
      continue;
    }
    depth.set(current.id, current.depth);
    for (const next of reverse.get(current.id) ?? []) {
      queue.push({ id: next, depth: current.depth + 1 });
    }
  }

  const reached = [...depth.entries()]
    .map(([nodeId, hitDepth]) => ({ node: nodeById(nodeId), depth: hitDepth }))
    .sort((a, b) => a.depth - b.depth || a.node.path.localeCompare(b.node.path));

  const reachedIds = new Set(reached.map((hit) => hit.node.id));
  const unaffected = harborNodes.filter((node) => node.id !== id && !reachedIds.has(node.id));

  return { changed: nodeById(id), reached, unaffected };
}

export type FanInRow = {
  node: HarborNode;
  fanIn: number;
  fanOut: number;
};

export function fanInRows(): FanInRow[] {
  return harborNodes
    .map((node) => ({
      node,
      fanIn: harborEdges.filter((edge) => edge.to === node.id).length,
      fanOut: harborEdges.filter((edge) => edge.from === node.id).length,
    }))
    .sort((a, b) => b.fanIn - a.fanIn || a.node.path.localeCompare(b.node.path));
}

export function isHarborNodeId(id: string): boolean {
  return harborNodes.some((node) => node.id === id);
}
