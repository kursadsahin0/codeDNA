import { NextResponse } from "next/server";
import { currentCredential } from "@/lib/github/auth";
import { githubConfigured, missingConfiguration, requireGithubConfig } from "@/lib/github/config";

export async function GET() {
  if (!githubConfigured()) return NextResponse.json({ configured: false, connected: false, missing: missingConfiguration() });
  try {
    const { session, credential } = await currentCredential();
    return NextResponse.json({ configured: true, connected: Boolean(session && credential), login: session?.login ?? null, appSlug: requireGithubConfig().appSlug });
  } catch {
    return NextResponse.json({ configured: true, connected: false, error: "Connection status is temporarily unavailable." }, { status: 503 });
  }
}
