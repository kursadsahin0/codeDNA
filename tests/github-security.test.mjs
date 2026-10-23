import test from "node:test";
import assert from "node:assert/strict";
import { createOAuthState, createSession, decryptToken, encryptToken, readSession, verifyOAuthState } from "../src/lib/github/security.ts";
import { githubErrorMessage, githubRetryAfter, normalizeRepository } from "../src/lib/github/normalize.ts";
import { analysisJobOwnerFilter, repositoryGrantFilter } from "../src/lib/github/data-scope.ts";
import { isSafeRepositoryPath, nextGitHubPage } from "../src/lib/github/utils.mjs";

process.env.CODEDNA_SESSION_SECRET = "test-only-session-secret-that-is-long-enough";
process.env.CODEDNA_TOKEN_ENCRYPTION_KEY = Buffer.alloc(32, 19).toString("base64");

test("OAuth state is short-lived, signed, and bound to the callback value", () => {
  const now = 1_800_000_000_000;
  const issued = createOAuthState(now);
  assert.equal(verifyOAuthState(issued.state, issued.cookie, now + 1_000), true);
  assert.equal(verifyOAuthState("attacker-state", issued.cookie, now + 1_000), false);
  assert.equal(verifyOAuthState(issued.state, `${issued.cookie}x`, now + 1_000), false);
  assert.equal(verifyOAuthState(issued.state, issued.cookie, now + 11 * 60_000), false);
  assert.equal(verifyOAuthState(null, issued.cookie, now), false);
});

test("session cookies are signed and expire", () => {
  const now = 1_800_000_000_000;
  const value = createSession({ id: 1234, login: "sample-user" }, now);
  assert.deepEqual(readSession(value, now + 1000), { githubUserId: 1234, login: "sample-user", expires: Math.floor(now / 1000) + 7 * 24 * 60 * 60 });
  assert.equal(readSession(`${value}x`, now), null);
  assert.equal(readSession(value, now + 8 * 24 * 60 * 60 * 1000), null);
});

test("GitHub credentials encrypt and authenticate at rest", () => {
  const token = JSON.stringify({ accessToken: "never-return-this-to-client", refreshToken: "refresh" });
  const encrypted = encryptToken(token);
  assert.equal(encrypted.includes("never-return-this-to-client"), false);
  assert.equal(decryptToken(encrypted), token);
  const pieces = encrypted.split(".");
  pieces[3] = `${pieces[3].startsWith("A") ? "B" : "A"}${pieces[3].slice(1)}`;
  assert.throws(() => decryptToken(pieces.join(".")));
});

test("repository metadata is normalized and rejects malformed external input", () => {
  const normalized = normalizeRepository({ id: 721, name: "codedna", full_name: "openai/codedna", owner: { login: "openai" }, description: "fixture", private: true, default_branch: "main", language: "TypeScript", html_url: "javascript:alert(1)", updated_at: "2026-10-20T10:00:00Z" });
  assert.equal(normalized?.visibility, "private");
  assert.equal(normalized?.html_url, "https://github.com/openai/codedna");
  assert.equal(normalized?.updated_at, "2026-10-20T10:00:00.000Z");
  assert.equal(normalizeRepository({ id: 1, name: "../escape", owner: { login: "org" }, private: false, default_branch: "main", updated_at: "today" }), null);
  assert.equal(normalizeRepository({ id: 1, name: "repo", owner: { login: "org" }, private: false, default_branch: "\nmain", updated_at: "2026-10-20" }), null);
});

test("file paths reject traversal and malformed segments", () => {
  assert.equal(isSafeRepositoryPath("src/lib/index.ts"), true);
  assert.equal(isSafeRepositoryPath(".github/workflows/check.yml"), true);
  assert.equal(isSafeRepositoryPath("../secrets.env"), false);
  assert.equal(isSafeRepositoryPath("src//file.ts"), false);
  assert.equal(isSafeRepositoryPath("/etc/passwd"), false);
  assert.equal(isSafeRepositoryPath("src\\file.ts"), false);
});

test("permission and rate-limit errors become actionable messages", () => {
  assert.match(githubErrorMessage(403, new Headers()), /permissions/);
  assert.match(githubErrorMessage(404, new Headers()), /no longer has access/);
  assert.match(githubErrorMessage(429, new Headers({ "retry-after": "5" })), /rate limit/);
  const headers = new Headers({ "x-ratelimit-remaining": "0", "x-ratelimit-reset": "1800000010" });
  assert.match(githubErrorMessage(403, headers), /rate limit/);
  assert.equal(githubRetryAfter(headers, 1_800_000_000_000), 10);
  assert.equal(githubRetryAfter(new Headers({ "retry-after": "7" })), 7);
});

test("repository grants and analysis reads are scoped to the authenticated GitHub user", () => {
  assert.equal(repositoryGrantFilter(42, 9001), "?github_user_id=eq.42&repository_id=eq.9001");
  assert.equal(analysisJobOwnerFilter(42, "job-123"), "?id=eq.job-123&github_user_id=eq.42");
  assert.notEqual(analysisJobOwnerFilter(42, "job-123"), analysisJobOwnerFilter(77, "job-123"));
});

test("GitHub pagination accepts only API links and keeps them on api.github.com", () => {
  assert.equal(nextGitHubPage('<https://api.github.com/user/installations?page=2>; rel="next", <https://api.github.com/user/installations?page=4>; rel="last"'), "/user/installations?page=2");
  assert.equal(nextGitHubPage('<https://attacker.example/steal>; rel="next"'), null);
  assert.equal(nextGitHubPage(null), null);
});
