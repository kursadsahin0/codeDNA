import { NextResponse } from "next/server";
import { currentSession } from "@/lib/github/auth";
import { consumeUserRateLimit, getAnalysisJob } from "@/lib/github/store";

export async function GET(_request: Request, context: { params: Promise<{ jobId: string }> }) {
  const session = await currentSession();
  if (!session) return NextResponse.json({ error: "Connect your GitHub account to view analysis progress." }, { status: 401 });
  const { jobId } = await context.params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(jobId)) return NextResponse.json({ error: "Analysis job was not found." }, { status: 404 });
  try {
    const rateLimit = await consumeUserRateLimit(session.githubUserId, "analysis-read", 120, 60);
    if (!rateLimit.allowed) return NextResponse.json({ error: "Analysis status request limit reached. Try again shortly.", retryAfter: rateLimit.retryAfter }, { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } });
    const job = await getAnalysisJob(session.githubUserId, jobId);
    if (!job) return NextResponse.json({ error: "Analysis job was not found." }, { status: 404 });
    return NextResponse.json({ job });
  } catch {
    return NextResponse.json({ error: "Analysis status is temporarily unavailable." }, { status: 503 });
  }
}
