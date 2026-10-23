import "server-only";
import { githubErrorMessage, githubRetryAfter, normalizeRepository as normalize } from "./normalize";
import { requireGithubConfig } from "./config";

export class GitHubApiError extends Error {
  constructor(readonly status: number, readonly retryAfter: number | null, message: string) {
    super(message);
    this.name = "GitHubApiError";
  }
}

type GithubCredential = {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number | null;
  refreshExpiresAt: number | null;
};

function safeApiPath(path: string) {
  const url = new URL(path, "https://api.github.com");
  if (url.origin !== "https://api.github.com" || !url.pathname.startsWith("/") || url.username || url.password || url.hash) {
    throw new GitHubApiError(400, null, "GitHub API path is invalid.");
  }
  return `${url.pathname}${url.search}`;
}

export async function githubRequest<T>(path: string, accessToken: string) {
  const response = await fetch(`https://api.github.com${safeApiPath(path)}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${accessToken}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    throw new GitHubApiError(response.status, githubRetryAfter(response.headers), githubErrorMessage(response.status, response.headers));
  }
  const remaining = Number(response.headers.get("x-ratelimit-remaining"));
  const reset = Number(response.headers.get("x-ratelimit-reset"));
  return {
    data: await response.json() as T,
    link: response.headers.get("link"),
    rateLimit: {
      remaining: Number.isFinite(remaining) ? remaining : null,
      resetAt: Number.isFinite(reset) ? reset : null,
    },
  };
}

export async function exchangeCode(code: string): Promise<GithubCredential> {
  const config = requireGithubConfig();
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: config.clientId, client_secret: config.clientSecret, code }),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const result = await response.json() as Record<string, unknown>;
  if (!response.ok || result.error || typeof result.access_token !== "string") throw new Error("GitHub authorization could not be completed.");
  const expiresIn = Number(result.expires_in);
  const refreshExpiresIn = Number(result.refresh_token_expires_in);
  return {
    accessToken: result.access_token,
    refreshToken: typeof result.refresh_token === "string" ? result.refresh_token : null,
    expiresAt: Number.isFinite(expiresIn) && expiresIn > 0 ? Date.now() + expiresIn * 1000 : null,
    refreshExpiresAt: Number.isFinite(refreshExpiresIn) && refreshExpiresIn > 0 ? Date.now() + refreshExpiresIn * 1000 : null,
  };
}

export async function refreshCredential(credential: GithubCredential): Promise<GithubCredential> {
  if (!credential.expiresAt || credential.expiresAt > Date.now() + 60_000) return credential;
  if (!credential.refreshToken || (credential.refreshExpiresAt && credential.refreshExpiresAt < Date.now())) {
    throw new GitHubApiError(401, null, "GitHub authorization expired. Reconnect the GitHub App.");
  }
  const config = requireGithubConfig();
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: config.clientId, client_secret: config.clientSecret, grant_type: "refresh_token", refresh_token: credential.refreshToken }),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const result = await response.json() as Record<string, unknown>;
  if (!response.ok || result.error || typeof result.access_token !== "string") {
    throw new GitHubApiError(response.status || 401, null, "GitHub authorization expired. Reconnect the GitHub App.");
  }
  const expiresIn = Number(result.expires_in);
  const refreshExpiresIn = Number(result.refresh_token_expires_in);
  return {
    accessToken: result.access_token,
    refreshToken: typeof result.refresh_token === "string" ? result.refresh_token : credential.refreshToken,
    expiresAt: Number.isFinite(expiresIn) && expiresIn > 0 ? Date.now() + expiresIn * 1000 : null,
    refreshExpiresAt: Number.isFinite(refreshExpiresIn) && refreshExpiresIn > 0 ? Date.now() + refreshExpiresIn * 1000 : credential.refreshExpiresAt,
  };
}

export async function listInstalledRepositories(accessToken: string) {
  const installations: Array<{ id: number }> = [];
  let next: string | null = "/user/installations?per_page=100";
  while (next) {
    const page = await githubRequest<{ installations?: Array<{ id: number }> }>(next, accessToken);
    installations.push(...(page.data.installations ?? []));
    next = nextGithubPage(page.link);
  }
  const repositories: unknown[] = [];
  for (const installation of installations) {
    next = `/user/installations/${encodeURIComponent(installation.id)}/repositories?per_page=100`;
    while (next) {
      const page = await githubRequest<{ repositories?: unknown[] }>(next, accessToken);
      repositories.push(...(page.data.repositories ?? []));
      next = nextGithubPage(page.link);
    }
  }
  return repositories;
}

export function normalizeRepository(input: unknown) {
  return normalize(input);
}

function nextGithubPage(link: string | null): string | null {
  const match = link?.match(/<([^>]+)>;\s*rel="next"/);
  if (!match?.[1]) return null;
  try {
    const url = new URL(match[1]);
    if (url.origin !== "https://api.github.com") throw new Error("Invalid pagination origin");
    return `${url.pathname}${url.search}`;
  } catch {
    if (link?.includes('rel="next"')) throw new GitHubApiError(502, null, "GitHub returned an invalid pagination link.");
    return null;
  }
}
