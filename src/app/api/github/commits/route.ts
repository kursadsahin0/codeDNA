import { NextResponse } from "next/server";
import { authorizedGitHubClient } from "@/lib/github/authorized-client";
import { GitHubApiError, githubRequest } from "@/lib/github/client";
import { getRepositoryAnalysisHistory, getStoredRepository, hasRepositoryAccess } from "@/lib/github/store";
import { isSafeRepositoryPath, nextGitHubPage } from "@/lib/github/utils.mjs";

type CommitApiRow = { sha?: unknown; commit?: { message?: unknown; author?: { name?: unknown; date?: unknown }; committer?: { date?: unknown } }; author?: { login?: unknown }; parents?: Array<{ sha?: unknown }> };

export async function GET(request: Request) {
  try {
    const auth = await authorizedGitHubClient();
    if (!auth) return NextResponse.json({ error: "Connect your GitHub account to view commit history." }, { status: 401 });
    const url = new URL(request.url);
    const repositoryId = Number(url.searchParams.get("repositoryId"));
    const page = Number(url.searchParams.get("page") ?? "1");
    if (!Number.isSafeInteger(repositoryId) || repositoryId <= 0 || !Number.isSafeInteger(page) || page < 1 || page > 1000) return NextResponse.json({ error: "Select a valid repository and history page." }, { status: 400 });
    if (!(await hasRepositoryAccess(auth.session.githubUserId, repositoryId))) return NextResponse.json({ error: "This repository is not available to your GitHub account." }, { status: 403 });
    const repository = await getStoredRepository(repositoryId);
    if (!repository) return NextResponse.json({ error: "Repository metadata is unavailable. Refresh the repository list." }, { status: 404 });
    const commitsResponse = await githubRequest<CommitApiRow[]>(`/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}/commits?sha=${encodeURIComponent(repository.default_branch)}&per_page=30&page=${page}`, auth.token);
    const commits = Array.isArray(commitsResponse.data) ? commitsResponse.data.flatMap((row) => {
      if (typeof row.sha !== "string" || !/^[0-9a-f]{40}$/i.test(row.sha)) return [];
      const rawDate = row.commit?.author?.date ?? row.commit?.committer?.date;
      const date = typeof rawDate === "string" ? new Date(rawDate) : null;
      if (!date || Number.isNaN(date.getTime())) return [];
      const subject = typeof row.commit?.message === "string" ? row.commit.message.split("\n")[0].replace(/[\u0000-\u001f\u007f]/g, " ").slice(0, 400) : "Commit message unavailable";
      const authorName = typeof row.author?.login === "string" ? row.author.login : typeof row.commit?.author?.name === "string" ? row.commit.author.name : "Unknown author";
      const parentSha = row.parents?.find((parent) => typeof parent.sha === "string" && /^[0-9a-f]{40}$/i.test(parent.sha))?.sha ?? null;
      return [{ sha: row.sha.toLowerCase(), subject, author: authorName.slice(0, 120), authoredAt: date.toISOString(), parentSha }];
    }) : [];
    const analysisHistory = await getRepositoryAnalysisHistory(auth.session.githubUserId, repositoryId, 10);
    const uniqueSnapshots = new Map<string, unknown>();
    for (const item of analysisHistory) {
      const sha = typeof item.analyzed_commit === "string" ? item.analyzed_commit : "";
      if (sha && !uniqueSnapshots.has(sha)) uniqueSnapshots.set(sha, item.changed_files);
    }
    const fileFrequency = new Map<string, number>();
    for (const value of uniqueSnapshots.values()) if (Array.isArray(value)) for (const path of value) if (typeof path === "string" && isSafeRepositoryPath(path)) fileFrequency.set(path, (fileFrequency.get(path) ?? 0) + 1);
    const frequentFiles = [...fileFrequency].map(([path, count]) => ({ path, count })).sort((a, b) => b.count - a.count || a.path.localeCompare(b.path)).slice(0, 12);
    const moduleFrequency = new Map<string, number>();
    for (const [path, count] of fileFrequency) { const modulePath = path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "."; moduleFrequency.set(modulePath, (moduleFrequency.get(modulePath) ?? 0) + count); }
    const frequentModules = [...moduleFrequency].map(([path, changes]) => ({ path, changes })).sort((a, b) => b.changes - a.changes || a.path.localeCompare(b.path)).slice(0, 8);
    const rateLimit = commitsResponse.rateLimit;
    const analysisSnapshots = [...uniqueSnapshots].map(([sha, value]) => ({ sha, changedFileCount: Array.isArray(value) ? value.filter((path) => typeof path === "string" && isSafeRepositoryPath(path)).length : 0 }));
    return NextResponse.json({ repository: { fullName: repository.full_name, htmlUrl: repository.html_url, branch: repository.default_branch }, commits, page, hasNext: Boolean(nextGitHubPage(commitsResponse.link)), rateLimit, frequency: { snapshots: uniqueSnapshots.size, files: frequentFiles, modules: frequentModules }, analysisSnapshots });
  } catch (error) {
    if (error instanceof GitHubApiError) return NextResponse.json({ error: error.message, retryAfter: error.retryAfter }, { status: error.status === 401 ? 401 : error.status === 403 ? 403 : error.status === 404 ? 404 : error.status === 429 ? 429 : 502, ...(error.retryAfter ? { headers: { "Retry-After": String(error.retryAfter) } } : {}) });
    return NextResponse.json({ error: "Commit history could not be loaded. Try again shortly." }, { status: 503 });
  }
}
