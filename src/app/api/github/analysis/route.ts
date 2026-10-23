import { NextResponse } from "next/server";
import { currentSession } from "@/lib/github/auth";
import { logServerError } from "@/lib/observability/logger";
import { consumeUserRateLimit, getLatestRepositoryJob, getRepositoryAnalysis, getRepositoryAnalysisByCommit, getRepositoryAnalysisById, getRepositoryAnalysisHistory, getStoredRepository, hasRepositoryAccess } from "@/lib/github/store";

export async function GET(request: Request) {
  const session = await currentSession();
  if (!session) return NextResponse.json({ error: "Connect your GitHub account to view repository analyses." }, { status: 401 });
  const value = new URL(request.url).searchParams.get("repositoryId");
  const compareId = new URL(request.url).searchParams.get("compareId");
  const commitSha = new URL(request.url).searchParams.get("commitSha");
  const repositoryId = Number(value);
  if (!value || !Number.isSafeInteger(repositoryId) || repositoryId <= 0) return NextResponse.json({ error: "Select a valid repository." }, { status: 400 });
  try {
    const rateLimit = await consumeUserRateLimit(session.githubUserId, "analysis-read", 120, 60);
    if (!rateLimit.allowed) return NextResponse.json({ error: "Analysis status request limit reached. Try again shortly.", retryAfter: rateLimit.retryAfter }, { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } });
    if (!(await hasRepositoryAccess(session.githubUserId, repositoryId))) return NextResponse.json({ error: "This repository is not available to your GitHub account." }, { status: 403 });
    const repository = await getStoredRepository(repositoryId);
    if (compareId && !/^[0-9a-f-]{36}$/i.test(compareId)) return NextResponse.json({ error: "Select a valid prior analysis." }, { status: 400 });
    if (compareId) {
      const comparison = await getRepositoryAnalysisById(session.githubUserId, repositoryId, compareId);
      return NextResponse.json({ comparison });
    }
    if (commitSha) {
      if (!/^[0-9a-f]{40}$/i.test(commitSha)) return NextResponse.json({ error: "A full commit SHA is required." }, { status: 400 });
      const [selectedAnalysis, currentAnalysis] = await Promise.all([
        getRepositoryAnalysisByCommit(session.githubUserId, repositoryId, commitSha.toLowerCase()),
        getRepositoryAnalysis(session.githubUserId, repositoryId),
      ]);
      return NextResponse.json({ selectedAnalysis, currentAnalysis });
    }
    const [analysis, job, history] = await Promise.all([
      getRepositoryAnalysis(session.githubUserId, repositoryId),
      getLatestRepositoryJob(session.githubUserId, repositoryId),
      getRepositoryAnalysisHistory(session.githubUserId, repositoryId),
    ]);
    return NextResponse.json({ repository, analysis, job, history });
  } catch (error) {
    logServerError("github.analysis.read_failed", error);
    return NextResponse.json({ error: "Repository analysis could not be loaded. Try again shortly." }, { status: 503 });
  }
}
