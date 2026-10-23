import { NextResponse } from "next/server";
import { authorizedGitHubClient } from "@/lib/github/authorized-client";
import { GitHubApiError, githubRequest } from "@/lib/github/client";
import { getStoredRepository, hasRepositoryAccess } from "@/lib/github/store";
import { isSafeRepositoryPath } from "@/lib/github/utils.mjs";

type CommitFile = { filename?: unknown; previous_filename?: unknown; status?: unknown; additions?: unknown; deletions?: unknown; changes?: unknown };
type CommitResponse = { sha?: unknown; commit?: { message?: unknown }; files?: CommitFile[] };

export async function GET(request: Request, { params }: { params: Promise<{ sha: string }> }) {
  try {
    const auth = await authorizedGitHubClient();
    if (!auth) return NextResponse.json({ error: "Connect your GitHub account to view commit details." }, { status: 401 });
    const { sha } = await params;
    if (!/^[0-9a-f]{40}$/i.test(sha)) return NextResponse.json({ error: "A full commit SHA is required." }, { status: 400 });
    const repositoryId = Number(new URL(request.url).searchParams.get("repositoryId"));
    if (!Number.isSafeInteger(repositoryId) || repositoryId <= 0) return NextResponse.json({ error: "Select a valid repository." }, { status: 400 });
    if (!(await hasRepositoryAccess(auth.session.githubUserId, repositoryId))) return NextResponse.json({ error: "This repository is not available to your GitHub account." }, { status: 403 });
    const repository = await getStoredRepository(repositoryId);
    if (!repository) return NextResponse.json({ error: "Repository metadata is unavailable." }, { status: 404 });
    const response = await githubRequest<CommitResponse>(`/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}/commits/${sha.toLowerCase()}?per_page=100`, auth.token);
    const data = response.data;
    if (typeof data.sha !== "string" || data.sha.toLowerCase() !== sha.toLowerCase()) return NextResponse.json({ error: "GitHub returned a different commit than requested." }, { status: 502 });
    const files = Array.isArray(data.files) ? data.files.flatMap((file) => {
      if (typeof file.filename !== "string" || !isSafeRepositoryPath(file.filename)) return [];
      const status = ["added", "modified", "removed", "renamed", "copied", "changed", "unchanged"].includes(String(file.status)) ? String(file.status) : "changed";
      const count = (value: unknown) => Number.isSafeInteger(value) && (value as number) >= 0 ? value as number : 0;
      return [{ path: file.filename, previousPath: typeof file.previous_filename === "string" && isSafeRepositoryPath(file.previous_filename) ? file.previous_filename : null, status, additions: count(file.additions), deletions: count(file.deletions), changes: count(file.changes) }];
    }) : [];
    const message = typeof data.commit?.message === "string" ? data.commit.message.replace(/[\u0000-\u001f\u007f]/g, " ").slice(0, 1000) : "Commit message unavailable";
    return NextResponse.json({ sha: sha.toLowerCase(), message, files, filesUnavailable: !Array.isArray(data.files), filesMayBeTruncated: files.length >= 300, sourceUrl: `${repository.html_url.replace(/\/$/, "")}/commit/${sha.toLowerCase()}` });
  } catch (error) {
    if (error instanceof GitHubApiError) return NextResponse.json({ error: error.message, retryAfter: error.retryAfter }, { status: error.status === 401 ? 401 : error.status === 403 ? 403 : error.status === 404 ? 404 : error.status === 429 ? 429 : 502, ...(error.retryAfter ? { headers: { "Retry-After": String(error.retryAfter) } } : {}) });
    return NextResponse.json({ error: "Commit details could not be loaded. Try again shortly." }, { status: 503 });
  }
}
