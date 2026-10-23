export type ConnectedRepository = { repository_id: number; full_name: string; html_url: string; default_branch: string };

/** Avoid expected 401 repository requests while the workspace uses its synthetic fixture. */
export async function loadConnectedRepositories(): Promise<ConnectedRepository[]> {
  const statusResponse = await fetch("/api/github/status", { cache: "no-store" });
  if (!statusResponse.ok) throw new Error("GitHub connection status is unavailable.");
  const status = await statusResponse.json() as { connected?: boolean };
  if (!status.connected) return [];

  const repositoriesResponse = await fetch("/api/github/repositories", { cache: "no-store" });
  const body = await repositoriesResponse.json() as { repositories?: ConnectedRepository[]; error?: string };
  if (!repositoriesResponse.ok) throw new Error(body.error ?? "GitHub repositories are unavailable.");
  return body.repositories ?? [];
}
