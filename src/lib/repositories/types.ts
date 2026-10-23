export type RepositoryId = "harbor" | "keel";

export type RepositoryFileChange = {
  path: string;
  change: "Modified" | "Added" | "Removed";
  commit: string;
  time: string;
};

export type StructuralWarning = {
  id: string;
  severity: "warning" | "info";
  title: string;
  detail: string;
};

export type RepositorySummary = {
  id: RepositoryId;
  name: string;
  fullName: string;
  description: string;
  analyzedAt: string;
  analyzedFiles: number;
  modules: number;
  dependencies: number;
  latestCommit: { hash: string; subject: string; author: string; time: string };
  commits: { hash: string; subject: string; author: string; time: string; files: string[] }[];
  mostImported: { path: string; importers: number; exports: number }[];
  recentChanges: RepositoryFileChange[];
  warnings: StructuralWarning[];
};

export interface RepositoryDataSource {
  listRepositories(): Promise<RepositorySummary[]>;
  getRepository(id: RepositoryId): Promise<RepositorySummary | null>;
}
