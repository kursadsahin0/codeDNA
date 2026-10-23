import { NextResponse } from "next/server";
import { currentCredential } from "@/lib/github/auth";
import { GitHubApiError, listInstalledRepositories, normalizeRepository, refreshCredential } from "@/lib/github/client";
import { encryptToken } from "@/lib/github/security";
import { consumeUserRateLimit, saveConnection, syncRepositories } from "@/lib/github/store";

export async function GET() {
  try {
    const { session, credential } = await currentCredential();
    if (!session || !credential) return NextResponse.json({ error: "Connect your GitHub account to list repositories." }, { status: 401 });
    const rateLimit = await consumeUserRateLimit(session.githubUserId, "github-api", 60, 60);
    if (!rateLimit.allowed) return NextResponse.json({ error: "CodeDNA request rate limit reached. Try again shortly.", retryAfter: rateLimit.retryAfter }, { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } });
    const fresh = await refreshCredential(credential);
    if (fresh !== credential) await saveConnection(session.githubUserId, encryptToken(JSON.stringify(fresh)));
    const rawRepositories = await listInstalledRepositories(fresh.accessToken);
    const byId = new Map(rawRepositories.map(normalizeRepository).filter((repository) => repository !== null).map((repository) => [repository.repository_id, repository]));
    const repositories = [...byId.values()];
    await syncRepositories(session.githubUserId, repositories);
    return NextResponse.json({ repositories });
  } catch (error) {
    if (error instanceof GitHubApiError) return NextResponse.json({ error: error.message, retryAfter: error.retryAfter }, { status: error.status === 401 ? 401 : error.status === 404 ? 403 : error.status === 403 ? 403 : error.status === 429 ? 429 : 502, ...(error.retryAfter ? { headers: { "Retry-After": String(error.retryAfter) } } : {}) });
    return NextResponse.json({ error: "GitHub repositories could not be loaded. Try again shortly." }, { status: 503 });
  }
}
