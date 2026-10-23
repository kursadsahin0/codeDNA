import "server-only";
import { requireGithubConfig } from "./config";
import { analysisJobOwnerFilter, repositoryGrantFilter } from "./data-scope";

type DbRow = Record<string, unknown>;

export async function consumeUserRateLimit(userId: number, bucket: string, limit: number, windowSeconds: number) {
  if (!Number.isSafeInteger(userId) || userId <= 0 || !/^[a-z0-9_-]{1,40}$/.test(bucket) || !Number.isSafeInteger(limit) || limit < 1 || !Number.isSafeInteger(windowSeconds) || windowSeconds < 1) {
    throw new Error("Rate limit parameters are invalid.");
  }
  const config = requireGithubConfig();
  const response = await fetch(`${config.supabaseUrl}/rest/v1/rpc/consume_github_user_rate_limit`, {
    method: "POST",
    headers: { apikey: config.serviceKey, Authorization: `Bearer ${config.serviceKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ p_user_id: userId, p_bucket: bucket, p_limit: limit, p_window_seconds: windowSeconds }),
    cache: "no-store",
    signal: AbortSignal.timeout(5_000),
  });
  if (!response.ok) throw new Error(`Rate limit check failed (${response.status}).`);
  const rows = await response.json() as Array<{ allowed?: unknown; retry_after?: unknown; remaining?: unknown }>;
  const result = rows[0];
  if (!result || typeof result.allowed !== "boolean") throw new Error("Rate limit check returned an invalid response.");
  return {
    allowed: result.allowed,
    retryAfter: Number.isSafeInteger(result.retry_after) ? Math.max(1, Number(result.retry_after)) : windowSeconds,
    remaining: Number.isSafeInteger(result.remaining) ? Math.max(0, Number(result.remaining)) : 0,
  };
}

async function request<T>(table: string, query: string, init: RequestInit = {}): Promise<T> {
  const config = requireGithubConfig();
  const response = await fetch(`${config.supabaseUrl}/rest/v1/${table}${query}`, {
    ...init,
    cache: "no-store",
    signal: init.signal ?? AbortSignal.timeout(15_000),
    headers: {
      apikey: config.serviceKey,
      Authorization: `Bearer ${config.serviceKey}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  if (!response.ok) throw new Error(`Repository storage request failed (${response.status}).`);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export async function upsertUser(user: { id: number; login: string; name: string | null; avatarUrl: string }) {
  await request("github_users", "?on_conflict=github_user_id", {
    method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ github_user_id: user.id, login: user.login, display_name: user.name, avatar_url: user.avatarUrl, updated_at: new Date().toISOString() }),
  });
}

export async function saveConnection(userId: number, encryptedCredential: string) {
  await request("github_connections", "?on_conflict=github_user_id", {
    method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ github_user_id: userId, encrypted_credential: encryptedCredential, updated_at: new Date().toISOString() }),
  });
}

export async function getConnection(userId: number): Promise<{ encrypted_credential: string } | null> {
  const rows = await request<{ encrypted_credential: string }[]>("github_connections", `?github_user_id=eq.${userId}&select=encrypted_credential&limit=1`);
  return rows[0] ?? null;
}

export type StoredRepository = {
  repository_id: number;
  owner: string;
  name: string;
  full_name: string;
  description: string | null;
  visibility: "public" | "private";
  default_branch: string;
  language: string | null;
  html_url: string;
  updated_at: string;
  connected_at?: string;
};

export async function upsertRepository(userId: number, repository: StoredRepository) {
  await request("github_repositories", "?on_conflict=repository_id", {
    method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ ...repository, synced_at: new Date().toISOString() }),
  });
  await request("github_user_repositories", "?on_conflict=github_user_id,repository_id", {
    method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ github_user_id: userId, repository_id: repository.repository_id, connected_at: new Date().toISOString() }),
  });
}

export async function syncRepositories(userId: number, repositories: StoredRepository[]) {
  if (repositories.length) {
    await request("github_repositories", "?on_conflict=repository_id", {
      method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(repositories.map((repository) => ({ ...repository, synced_at: new Date().toISOString() }))),
    });
    await request("github_user_repositories", "?on_conflict=github_user_id,repository_id", {
      method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(repositories.map((repository) => ({ github_user_id: userId, repository_id: repository.repository_id, connected_at: new Date().toISOString() }))),
    });
  }
  await removeUnavailableRepositories(userId, repositories.map((repository) => repository.repository_id));
}

export async function removeUnavailableRepositories(userId: number, availableIds: number[]) {
  const notIn = availableIds.length ? `&repository_id=not.in.(${availableIds.join(",")})` : "";
  await request("github_user_repositories", `?github_user_id=eq.${userId}${notIn}`, { method: "DELETE" });
}

export async function hasRepositoryAccess(userId: number, repositoryId: number) {
  const rows = await request<DbRow[]>("github_user_repositories", `${repositoryGrantFilter(userId, repositoryId)}&select=repository_id&limit=1`);
  return rows.length > 0;
}

export async function createAnalysisJob(userId: number, repositoryId: number) {
  const rows = await request<{ id: string }[]>("github_analysis_jobs?select=id", "", {
    method: "POST", headers: { Prefer: "return=representation" },
    body: JSON.stringify({ github_user_id: userId, repository_id: repositoryId, status: "queued" }),
  });
  return rows[0]?.id;
}

export async function getAnalysisJob(userId: number, jobId: string) {
  const rows = await request<DbRow[]>("github_analysis_jobs", `${analysisJobOwnerFilter(userId, jobId)}&select=id,status,progress,message,created_at,started_at,finished_at,result&limit=1`);
  return rows[0] ?? null;
}

export async function getRepositoryAnalysis(userId: number, repositoryId: number) {
  const rows = await request<DbRow[]>(
    "github_analyses",
    `?github_user_id=eq.${userId}&repository_id=eq.${repositoryId}&select=id,default_branch,analyzed_commit,commit_subject,analysis_status,analyzed_file_count,skipped_file_count,error_count,duration_ms,parser_version,graph,diagnostics,changed_files,created_at&order=created_at.desc&limit=1`,
  );
  return rows[0] ?? null;
}

export async function getRepositoryAnalysisHistory(userId: number, repositoryId: number, limit = 10) {
  const safeLimit = Math.max(1, Math.min(Math.floor(limit), 20));
  return request<DbRow[]>(
    "github_analyses",
    `?github_user_id=eq.${userId}&repository_id=eq.${repositoryId}&select=id,analyzed_commit,commit_subject,analysis_status,changed_files,created_at&order=created_at.desc&limit=${safeLimit}`,
  );
}

export async function getRepositoryAnalysisById(userId: number, repositoryId: number, analysisId: string) {
  const rows = await request<DbRow[]>(
    "github_analyses",
    `?id=eq.${encodeURIComponent(analysisId)}&github_user_id=eq.${userId}&repository_id=eq.${repositoryId}&select=id,analyzed_commit,commit_subject,graph,changed_files,created_at&limit=1`,
  );
  return rows[0] ?? null;
}

export async function getRepositoryAnalysisByCommit(userId: number, repositoryId: number, commitSha: string) {
  const rows = await request<DbRow[]>(
    "github_analyses",
    `?github_user_id=eq.${userId}&repository_id=eq.${repositoryId}&analyzed_commit=eq.${encodeURIComponent(commitSha)}&select=id,analyzed_commit,commit_subject,graph,created_at,analysis_status&order=created_at.desc&limit=1`,
  );
  return rows[0] ?? null;
}

export async function getCommitComparison(userId: number, repositoryId: number, baseSha: string, headSha: string) {
  const rows = await request<DbRow[]>(
    "github_commit_comparisons",
    `?github_user_id=eq.${userId}&repository_id=eq.${repositoryId}&base_sha=eq.${baseSha}&head_sha=eq.${headSha}&select=id,base_sha,head_sha,result,created_at&limit=1`,
  );
  return rows[0] ?? null;
}

export async function saveCommitComparison(userId: number, repositoryId: number, baseSha: string, headSha: string, result: Record<string, unknown>) {
  const rows = await request<DbRow[]>("github_commit_comparisons?on_conflict=github_user_id,repository_id,base_sha,head_sha&select=id,base_sha,head_sha,result,created_at", "", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify({ github_user_id: userId, repository_id: repositoryId, base_sha: baseSha, head_sha: headSha, result }),
  });
  return rows[0] ?? null;
}

export async function getLatestRepositoryJob(userId: number, repositoryId: number) {
  const rows = await request<DbRow[]>(
    "github_analysis_jobs",
    `?github_user_id=eq.${userId}&repository_id=eq.${repositoryId}&select=id,status,progress,message,result,created_at&order=created_at.desc&limit=1`,
  );
  return rows[0] ?? null;
}

export async function getStoredRepository(repositoryId: number) {
  const rows = await request<StoredRepository[]>(
    "github_repositories",
    `?repository_id=eq.${repositoryId}&select=repository_id,owner,name,full_name,description,visibility,default_branch,language,html_url,updated_at&limit=1`,
  );
  return rows[0] ?? null;
}

export async function disconnectUser(userId: number) {
  const filter = `?github_user_id=eq.${userId}`;
  await request("github_analysis_jobs", filter, { method: "DELETE" });
  await request("github_user_repositories", filter, { method: "DELETE" });
  await request("github_connections", filter, { method: "DELETE" });
  await request("github_users", filter, { method: "DELETE" });
}
