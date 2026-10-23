export type NormalizedGitHubRepository = {
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
};

export function normalizeRepository(input: unknown): NormalizedGitHubRepository | null {
  if (!input || typeof input !== "object") return null;
  const repo = input as Record<string, unknown>;
  const ownerObject = repo.owner && typeof repo.owner === "object" ? repo.owner as Record<string, unknown> : null;
  const owner = ownerObject?.login;
  if (!Number.isSafeInteger(repo.id) || (repo.id as number) <= 0 || typeof repo.name !== "string" || !/^[\w.-]{1,100}$/.test(repo.name) || typeof owner !== "string" || !/^[\w.-]{1,100}$/.test(owner)) return null;
  if (typeof repo.default_branch !== "string" || !repo.default_branch || repo.default_branch.length > 255 || /[\u0000-\u001f\u007f]/.test(repo.default_branch)) return null;
  if (typeof repo.private !== "boolean" || typeof repo.updated_at !== "string") return null;
  const updated = new Date(repo.updated_at);
  if (Number.isNaN(updated.getTime())) return null;
  return {
    repository_id: repo.id as number,
    owner,
    name: repo.name,
    full_name: `${owner}/${repo.name}`,
    description: typeof repo.description === "string" ? repo.description.slice(0, 500) : null,
    visibility: repo.private ? "private" : "public",
    default_branch: repo.default_branch,
    language: typeof repo.language === "string" ? repo.language.slice(0, 80) : null,
    html_url: `https://github.com/${owner}/${repo.name}`,
    updated_at: updated.toISOString(),
  };
}

export function githubErrorMessage(status: number, headers: Headers) {
  if (status === 429 || (status === 403 && headers.get("x-ratelimit-remaining") === "0")) return "GitHub API rate limit reached. Try again after the reset time.";
  if (status === 401) return "GitHub authorization expired. Reconnect the GitHub App.";
  if (status === 403) return "GitHub denied access to this resource. Check the App installation permissions.";
  if (status === 404) return "The repository is unavailable or the App no longer has access.";
  return "GitHub could not complete the request.";
}

export function githubRetryAfter(headers: Headers, now = Date.now()) {
  const retryAfterHeader = Number(headers.get("retry-after"));
  const resetAt = Number(headers.get("x-ratelimit-reset"));
  if (Number.isFinite(retryAfterHeader) && retryAfterHeader > 0) return retryAfterHeader;
  if (headers.get("x-ratelimit-remaining") === "0" && Number.isFinite(resetAt)) return Math.max(1, Math.ceil(resetAt - now / 1000));
  return null;
}
