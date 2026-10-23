import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { exchangeCode, githubRequest } from "@/lib/github/client";
import { requireGithubConfig } from "@/lib/github/config";
import { oauthStateCookieName, sessionCookieName } from "@/lib/github/auth";
import { createSession, encryptToken, verifyOAuthState } from "@/lib/github/security";
import { saveConnection, upsertUser } from "@/lib/github/store";

export async function GET(request: Request) {
  const url = new URL(request.url);
  let redirectOrigin: string;
  try {
    redirectOrigin = new URL(process.env.NEXT_PUBLIC_APP_URL!).origin;
  } catch {
    return NextResponse.json({ error: "GitHub integration is not configured." }, { status: 503 });
  }
  const jar = await cookies();
  const stateCookie = jar.get(oauthStateCookieName)?.value;
  const cleanRedirect = (path: string) => {
    const response = NextResponse.redirect(new URL(path, redirectOrigin));
    response.cookies.set(oauthStateCookieName, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/api/github/callback", maxAge: 0 });
    return response;
  };

  if (url.searchParams.has("error")) return cleanRedirect("/repositories?github=denied");
  if (!verifyOAuthState(url.searchParams.get("state"), stateCookie)) return cleanRedirect("/repositories?github=state-error");
  const code = url.searchParams.get("code");
  if (!code || code.length > 1024) return cleanRedirect("/repositories?github=auth-error");

  try {
    const config = requireGithubConfig();
    const credential = await exchangeCode(code);
    const { data: user } = await githubRequest<{ id: number; login: string; name: string | null; avatar_url: string }>("/user", credential.accessToken);
    if (!Number.isSafeInteger(user.id) || !user.login) return cleanRedirect("/repositories?github=auth-error");
    await upsertUser({ id: user.id, login: user.login, name: user.name, avatarUrl: user.avatar_url });
    await saveConnection(user.id, encryptToken(JSON.stringify(credential)));
    const response = NextResponse.redirect(new URL("/repositories?github=connected", config.appUrl));
    response.cookies.set(sessionCookieName, createSession({ id: user.id, login: user.login }), {
      httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 7 * 24 * 60 * 60,
    });
    response.cookies.set(oauthStateCookieName, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/api/github/callback", maxAge: 0 });
    return response;
  } catch {
    return cleanRedirect("/repositories?github=auth-error");
  }
}
