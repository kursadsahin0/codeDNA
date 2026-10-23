import test from "node:test";
import assert from "node:assert/strict";

const disposable = process.env.CODEDNA_TEST_DATABASE_DISPOSABLE === "true";
const supabaseUrl = process.env.CODEDNA_TEST_SUPABASE_URL;
const serviceKey = process.env.CODEDNA_TEST_SUPABASE_SERVICE_ROLE_KEY;
const configured = disposable && Boolean(supabaseUrl && serviceKey);

async function database(path, { method = "GET", body, prefer } = {}) {
  const response = await fetch(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      ...(prefer ? { Prefer: prefer } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Disposable integration database returned ${response.status} for ${method} ${path.split("?")[0]}.`);
  if (response.status === 204) return null;
  return response.json();
}

test("repository grants isolate users and the durable limiter rejects excess requests", { skip: configured ? false : "Set CODEDNA_TEST_DATABASE_DISPOSABLE=true and dedicated CODEDNA_TEST_SUPABASE_* credentials for a disposable migrated database." }, async () => {
  const baseId = Date.now() * 10 + Math.floor(Math.random() * 1_000_000);
  const suffix = String(baseId);
  const userA = baseId;
  const userB = userA + 1;
  const repositoryId = userA + 2;
  const now = new Date().toISOString();

  try {
    await database("github_users", { method: "POST", prefer: "return=minimal", body: [
      { github_user_id: userA, login: `e2e-a-${suffix}`, updated_at: now },
      { github_user_id: userB, login: `e2e-b-${suffix}`, updated_at: now },
    ] });
    await database("github_repositories", { method: "POST", prefer: "return=minimal", body: {
      repository_id: repositoryId, owner: "codedna-e2e", name: `fixture-${suffix}`, full_name: `codedna-e2e/fixture-${suffix}`,
      visibility: "private", default_branch: "main", html_url: "https://github.com/codedna-e2e/fixture",
      updated_at: now, synced_at: now,
    } });
    await database("github_user_repositories", { method: "POST", prefer: "return=minimal", body: {
      github_user_id: userA, repository_id: repositoryId,
    } });

    const grantsA = await database(`github_user_repositories?github_user_id=eq.${userA}&repository_id=eq.${repositoryId}&select=repository_id`);
    const grantsB = await database(`github_user_repositories?github_user_id=eq.${userB}&repository_id=eq.${repositoryId}&select=repository_id`);
    assert.equal(grantsA.length, 1);
    assert.equal(grantsB.length, 0);

    const first = await database("rpc/consume_github_user_rate_limit", { method: "POST", body: {
      p_user_id: userA, p_bucket: `test-${suffix}`.slice(0, 40), p_limit: 1, p_window_seconds: 60,
    } });
    const second = await database("rpc/consume_github_user_rate_limit", { method: "POST", body: {
      p_user_id: userA, p_bucket: `test-${suffix}`.slice(0, 40), p_limit: 1, p_window_seconds: 60,
    } });
    assert.equal(first[0]?.allowed, true);
    assert.equal(second[0]?.allowed, false);
    assert.ok(second[0]?.retry_after > 0);
  } finally {
    await database(`github_users?github_user_id=in.(${userA},${userB})`, { method: "DELETE" });
    await database(`github_repositories?repository_id=eq.${repositoryId}`, { method: "DELETE" });
  }
});
