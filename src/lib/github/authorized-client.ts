import "server-only";
import { currentCredential } from "./auth";
import { GitHubApiError, refreshCredential } from "./client";
import { encryptToken } from "./security";
import { consumeUserRateLimit, saveConnection } from "./store";

export async function authorizedGitHubClient() {
  const { session, credential } = await currentCredential();
  if (!session || !credential) return null;
  const limit = await consumeUserRateLimit(session.githubUserId, "github-api", 60, 60);
  if (!limit.allowed) throw new GitHubApiError(429, limit.retryAfter, "CodeDNA request rate limit reached. Try again shortly.");
  const fresh = await refreshCredential(credential);
  if (fresh !== credential) await saveConnection(session.githubUserId, encryptToken(JSON.stringify(fresh)));
  if (!fresh.accessToken) throw new GitHubApiError(401, null, "GitHub authorization expired. Reconnect the GitHub App.");
  return { session, token: fresh.accessToken };
}
