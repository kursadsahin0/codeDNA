import { NextResponse } from "next/server";
import { authorizedGitHubClient } from "@/lib/github/authorized-client";
import { GitHubApiError, githubRequest } from "@/lib/github/client";
import { getCommitComparison, getStoredRepository, hasRepositoryAccess, saveCommitComparison } from "@/lib/github/store";
import { isSafeRepositoryPath, nextGitHubPage } from "@/lib/github/utils.mjs";
import { requireSameOrigin } from "@/lib/github/auth";

type CompareFile = { filename?: unknown; previous_filename?: unknown; status?: unknown; additions?: unknown; deletions?: unknown; changes?: unknown };
type CompareResponse = { status?: unknown; ahead_by?: unknown; behind_by?: unknown; total_commits?: unknown; files?: CompareFile[] };

export async function POST(request: Request) {
  if (!requireSameOrigin(request)) return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  try {
    const auth = await authorizedGitHubClient();
    if (!auth) return NextResponse.json({ error: "Connect your GitHub account to compare commits." }, { status: 401 });
    const contentLength = Number(request.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > 2048) return NextResponse.json({ error: "Request body is too large." }, { status: 413 });
    const reader = request.body?.getReader();
    if (!reader) return NextResponse.json({ error: "A JSON request body is required." }, { status: 400 });
    const chunks: Uint8Array[] = [];
    let byteLength = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      byteLength += value.byteLength;
      if (byteLength > 2048) { await reader.cancel(); return NextResponse.json({ error: "Request body is too large." }, { status: 413 }); }
      chunks.push(value);
    }
    const body = JSON.parse(new TextDecoder().decode(Buffer.concat(chunks))) as { repositoryId?: unknown; baseSha?: unknown; headSha?: unknown };
    if (typeof body.repositoryId !== "number" || !Number.isSafeInteger(body.repositoryId) || body.repositoryId <= 0 || typeof body.baseSha !== "string" || !/^[0-9a-f]{40}$/i.test(body.baseSha) || typeof body.headSha !== "string" || !/^[0-9a-f]{40}$/i.test(body.headSha) || body.baseSha.toLowerCase() === body.headSha.toLowerCase()) return NextResponse.json({ error: "Choose two different commits using their full SHA values." }, { status: 400 });
    const repositoryId = Number(body.repositoryId); const baseSha = body.baseSha.toLowerCase(); const headSha = body.headSha.toLowerCase();
    if (!(await hasRepositoryAccess(auth.session.githubUserId, repositoryId))) return NextResponse.json({ error: "This repository is not available to your GitHub account." }, { status: 403 });
    const cached = await getCommitComparison(auth.session.githubUserId, repositoryId, baseSha, headSha);
    if (cached) return NextResponse.json({ comparison: cached, cached: true });
    const repository = await getStoredRepository(repositoryId);
    if (!repository) return NextResponse.json({ error: "Repository metadata is unavailable." }, { status: 404 });
    const response = await githubRequest<CompareResponse>(`/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}/compare/${baseSha}...${headSha}?per_page=100&page=1`, auth.token);
    const payload = response.data;
    const safeFiles = Array.isArray(payload.files) ? payload.files.flatMap((file) => {
      if (typeof file.filename !== "string" || !isSafeRepositoryPath(file.filename)) return [];
      const count = (value: unknown) => Number.isSafeInteger(value) && (value as number) >= 0 ? value as number : 0;
      return [{ path: file.filename, previousPath: typeof file.previous_filename === "string" && isSafeRepositoryPath(file.previous_filename) ? file.previous_filename : null, status: String(file.status ?? "changed").slice(0, 30), additions: count(file.additions), deletions: count(file.deletions), changes: count(file.changes) }];
    }) : [];
    const result = {
      baseSha, headSha,
      status: ["ahead", "behind", "identical", "diverged"].includes(String(payload.status)) ? payload.status : "unknown",
      aheadBy: Number.isSafeInteger(payload.ahead_by) ? payload.ahead_by : null,
      behindBy: Number.isSafeInteger(payload.behind_by) ? payload.behind_by : null,
      totalCommits: Number.isSafeInteger(payload.total_commits) ? payload.total_commits : null,
      files: safeFiles.slice(0, 100), filesReported: safeFiles.length,
      filesTruncated: safeFiles.length > 100 || safeFiles.length >= 300 || Boolean(nextGitHubPage(response.link)),
      rateLimit: response.rateLimit,
    };
    const comparison = await saveCommitComparison(auth.session.githubUserId, repositoryId, baseSha, headSha, result);
    return NextResponse.json({ comparison, cached: false });
  } catch (error) {
    if (error instanceof SyntaxError) return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    if (error instanceof GitHubApiError) return NextResponse.json({ error: error.message, retryAfter: error.retryAfter }, { status: error.status === 401 ? 401 : error.status === 403 ? 403 : error.status === 404 ? 404 : error.status === 429 ? 429 : 502, ...(error.retryAfter ? { headers: { "Retry-After": String(error.retryAfter) } } : {}) });
    return NextResponse.json({ error: "Commit comparison could not be completed. Try again shortly." }, { status: 503 });
  }
}
