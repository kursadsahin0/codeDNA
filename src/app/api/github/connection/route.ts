import { NextResponse } from "next/server";
import { currentCredential, requireSameOrigin, sessionCookieName } from "@/lib/github/auth";
import { requireGithubConfig } from "@/lib/github/config";
import { disconnectUser } from "@/lib/github/store";

export async function DELETE(request: Request) {
  if (!requireSameOrigin(request)) return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  const { session, credential } = await currentCredential();
  if (!session) return NextResponse.json({ error: "No GitHub account is connected." }, { status: 401 });
  let tokenRevoked = false;
  try {
    if (credential) {
      const config = requireGithubConfig();
      const basic = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64");
      const response = await fetch(`https://api.github.com/applications/${encodeURIComponent(config.clientId)}/grant`, {
        method: "DELETE",
        headers: { Accept: "application/vnd.github+json", Authorization: `Basic ${basic}`, "X-GitHub-Api-Version": "2022-11-28", "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: credential.accessToken }),
        cache: "no-store",
      });
      tokenRevoked = response.ok || response.status === 404;
    }
  } catch {
    // Remove local credentials even when GitHub's revoke endpoint is temporarily unreachable.
  }
  try {
    await disconnectUser(session.githubUserId);
    const response = NextResponse.json({ disconnected: true, tokenRevoked });
    response.cookies.delete(sessionCookieName);
    return response;
  } catch {
    return NextResponse.json({ error: "The local connection could not be removed. Try again." }, { status: 503 });
  }
}
