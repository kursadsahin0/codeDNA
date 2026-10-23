import { NextResponse } from "next/server";
import { currentSession, requireSameOrigin } from "@/lib/github/auth";
import { consumeUserRateLimit, createAnalysisJob, hasRepositoryAccess } from "@/lib/github/store";

export async function POST(request: Request) {
  if (!requireSameOrigin(request)) return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  const session = await currentSession();
  if (!session) return NextResponse.json({ error: "Connect your GitHub account before starting an analysis." }, { status: 401 });
  try {
    const contentLength = Number(request.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > 1024) return NextResponse.json({ error: "Request body is too large." }, { status: 413 });
    const reader = request.body?.getReader();
    if (!reader) return NextResponse.json({ error: "A JSON request body is required." }, { status: 400 });
    const chunks: Uint8Array[] = [];
    let byteLength = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      byteLength += value.byteLength;
      if (byteLength > 1024) { await reader.cancel(); return NextResponse.json({ error: "Request body is too large." }, { status: 413 }); }
      chunks.push(value);
    }
    let body: { repositoryId?: unknown };
    try { body = JSON.parse(new TextDecoder().decode(Buffer.concat(chunks))) as { repositoryId?: unknown }; }
    catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }
    const repositoryId = body.repositoryId;
    if (typeof repositoryId !== "number" || !Number.isSafeInteger(repositoryId) || repositoryId <= 0) return NextResponse.json({ error: "Select a valid repository." }, { status: 400 });
    if (!(await hasRepositoryAccess(session.githubUserId, repositoryId))) return NextResponse.json({ error: "This repository is not available to your GitHub account. Refresh the repository list and check the App installation." }, { status: 403 });
    const rateLimit = await consumeUserRateLimit(session.githubUserId, "analysis-job", 5, 600);
    if (!rateLimit.allowed) return NextResponse.json({ error: "Analysis request limit reached. Try again shortly.", retryAfter: rateLimit.retryAfter }, { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } });
    const jobId = await createAnalysisJob(session.githubUserId, repositoryId);
    if (!jobId) return NextResponse.json({ error: "The analysis job could not be queued." }, { status: 503 });
    return NextResponse.json({ jobId, status: "queued" }, { status: 202 });
  } catch {
    return NextResponse.json({ error: "The analysis job could not be queued. Try again shortly." }, { status: 503 });
  }
}
