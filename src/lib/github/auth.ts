import "server-only";
import { cookies } from "next/headers";
import { decryptToken, readSession } from "./security";
import { getConnection } from "./store";

export const sessionCookieName = "codedna_session";
export const oauthStateCookieName = "codedna_github_oauth_state";

export async function currentSession() {
  const jar = await cookies();
  return readSession(jar.get(sessionCookieName)?.value);
}

export async function currentCredential() {
  const session = await currentSession();
  if (!session) return { session: null, credential: null };
  const stored = await getConnection(session.githubUserId);
  if (!stored) return { session, credential: null };
  try {
    const credential = JSON.parse(decryptToken(stored.encrypted_credential)) as {
      accessToken: string; refreshToken: string | null; expiresAt: number | null; refreshExpiresAt: number | null;
    };
    if (!credential.accessToken) return { session, credential: null };
    return { session, credential };
  } catch {
    return { session, credential: null };
  }
}

export function requireSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const appOrigin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  return Boolean(origin && appOrigin && origin === appOrigin);
}
