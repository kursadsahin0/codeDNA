import type { RepositoryDataSource, RepositoryId, RepositorySummary } from "./types";

const fixtures: RepositorySummary[] = [
  {
    id: "harbor",
    name: "harbor",
    fullName: "workspace / harbor",
    description: "A small TypeScript HTTP router used as an interactive architecture fixture.",
    analyzedAt: "Today, 10:42",
    analyzedFiles: 42,
    modules: 11,
    dependencies: 68,
    latestCommit: {
      hash: "c4e1a28",
      subject: "Introduce request context",
      author: "M. Chen",
      time: "28 min ago",
    },
    commits: [
      { hash: "c4e1a28", subject: "Introduce request context", author: "M. Chen", time: "28 min ago", files: ["src/context.ts", "src/server.ts"] },
      { hash: "91ab304", subject: "Register routes from package entry", author: "A. Patel", time: "Yesterday", files: ["src/router.ts", "src/route.ts", "src/index.ts"] },
      { hash: "77c0e8b", subject: "Compose middleware before handling", author: "M. Chen", time: "Oct 17", files: ["src/middleware.ts", "src/router.ts"] },
    ],
    mostImported: [
      { path: "src/context.ts", importers: 4, exports: 2 },
      { path: "src/errors.ts", importers: 3, exports: 1 },
      { path: "src/router.ts", importers: 2, exports: 3 },
    ],
    recentChanges: [
      { path: "src/context.ts", change: "Modified", commit: "c4e1a28", time: "28 min ago" },
      { path: "src/server.ts", change: "Modified", commit: "c4e1a28", time: "28 min ago" },
      { path: "src/router.ts", change: "Added", commit: "91ab304", time: "Yesterday" },
      { path: "src/middleware.ts", change: "Modified", commit: "77c0e8b", time: "Oct 17" },
    ],
    warnings: [
      {
        id: "context-fanin",
        severity: "warning",
        title: "Shared module has elevated fan-in",
        detail: "src/context.ts is imported by 4 modules. Changes may reach multiple request paths.",
      },
      {
        id: "external-pattern",
        severity: "info",
        title: "External dependency boundary",
        detail: "src/match.ts delegates path compilation to path-to-regexp.",
      },
    ],
  },
  {
    id: "keel",
    name: "keel",
    fullName: "workspace / keel",
    description: "A synthetic job queue service for exploring dependency and change relationships.",
    analyzedAt: "Today, 09:18",
    analyzedFiles: 87,
    modules: 19,
    dependencies: 143,
    latestCommit: {
      hash: "8a72d0c",
      subject: "Split retry policy from worker",
      author: "A. Patel",
      time: "2 hours ago",
    },
    commits: [
      { hash: "8a72d0c", subject: "Split retry policy from worker", author: "A. Patel", time: "2 hours ago", files: ["src/worker/retry.ts", "src/worker/index.ts"] },
      { hash: "6d31a92", subject: "Define shared job payload types", author: "J. Lee", time: "Yesterday", files: ["src/jobs/types.ts"] },
      { hash: "2b3401f", subject: "Add queue client configuration", author: "J. Lee", time: "Oct 18", files: ["src/queue/client.ts", "src/config.ts"] },
    ],
    mostImported: [
      { path: "src/jobs/types.ts", importers: 7, exports: 9 },
      { path: "src/queue/client.ts", importers: 5, exports: 3 },
      { path: "src/config.ts", importers: 4, exports: 6 },
    ],
    recentChanges: [
      { path: "src/worker/retry.ts", change: "Added", commit: "8a72d0c", time: "2 hours ago" },
      { path: "src/worker/index.ts", change: "Modified", commit: "8a72d0c", time: "2 hours ago" },
      { path: "src/jobs/types.ts", change: "Modified", commit: "6d31a92", time: "Yesterday" },
      { path: "src/queue/client.ts", change: "Modified", commit: "2b3401f", time: "Oct 18" },
    ],
    warnings: [
      {
        id: "types-fanin",
        severity: "warning",
        title: "Core types are widely shared",
        detail: "src/jobs/types.ts is imported by 7 modules across 3 feature areas.",
      },
      {
        id: "retry-cycle",
        severity: "info",
        title: "Retry path crosses worker boundaries",
        detail: "Review the worker retry flow when changing queue acknowledgement behavior.",
      },
    ],
  },
];

/** Swap this adapter for an API-backed RepositoryDataSource when repository sync is available. */
export const mockRepositoryDataSource: RepositoryDataSource = {
  async listRepositories() {
    return fixtures;
  },
  async getRepository(id: RepositoryId) {
    return fixtures.find((repository) => repository.id === id) ?? null;
  },
};

export function repositoryById(id: string | undefined): RepositorySummary {
  return fixtures.find((repository) => repository.id === id) ?? fixtures[0]!;
}

export function allMockRepositories() {
  return fixtures;
}
