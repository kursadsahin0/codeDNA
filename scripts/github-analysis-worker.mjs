import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { isSafeRepositoryPath } from "../src/lib/github/utils.mjs";
import { analyzeRepository, parserVersion } from "../src/lib/analysis/engine.mjs";

const apiUrl = `${required("SUPABASE_URL").replace(/\/$/, "")}/rest/v1`;
const serviceKey = required("SUPABASE_SERVICE_ROLE_KEY");
const encryptionKey = Buffer.from(required("CODEDNA_TOKEN_ENCRYPTION_KEY"), "base64");
const clientId = required("GITHUB_APP_CLIENT_ID");
const clientSecret = required("GITHUB_APP_CLIENT_SECRET");
if (encryptionKey.length !== 32) throw new Error("CODEDNA_TOKEN_ENCRYPTION_KEY must decode to 32 bytes.");

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required to run the GitHub analysis worker.`);
  return value;
}

async function db(path, init = {}) {
  const response = await fetch(`${apiUrl}/${path}`, {
    ...init,
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json", ...init.headers },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`Storage request failed (${response.status}).`);
  if (response.status === 204) return null;
  return response.json();
}

function decrypt(value) {
  const [version, iv, tag, data] = value.split(".");
  if (version !== "v1" || !iv || !tag || !data) throw new Error("Stored credential is invalid.");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey, Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(data, "base64url")), decipher.final()]).toString("utf8");
}

function encrypt(value) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey, iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return `v1.${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${ciphertext.toString("base64url")}`;
}

async function github(path, token) {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${token}`, "X-GitHub-Api-Version": "2022-11-28" }, cache: "no-store", signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    const error = new Error(response.status === 429 || (response.status === 403 && response.headers.get("x-ratelimit-remaining") === "0") ? "rate_limited" : response.status === 401 ? "authorization_expired" : response.status === 403 || response.status === 404 ? "repository_access_revoked" : "github_request_failed");
    error.retryAfter = Number(response.headers.get("retry-after")) || null;
    throw error;
  }
  return response.json();
}

async function githubBlob(path, token, maxBytes) {
  const blob = await github(path, token);
  if (blob.encoding !== "base64" || typeof blob.content !== "string" || !Number.isSafeInteger(blob.size) || blob.size < 0 || blob.size > maxBytes) {
    return { skipped: true, reason: "file_too_large_or_unreadable" };
  }
  try {
    const bytes = Buffer.from(blob.content.replace(/\s/g, ""), "base64");
    if (bytes.length !== blob.size || bytes.includes(0)) return { skipped: true, reason: "binary_or_invalid_content" };
    return { content: new TextDecoder("utf-8", { fatal: true }).decode(bytes) };
  } catch { return { skipped: true, reason: "binary_or_invalid_content" }; }
}

async function accessToken(job) {
  const rows = await db(`github_connections?github_user_id=eq.${job.github_user_id}&select=encrypted_credential&limit=1`);
  if (!rows[0]) throw new Error("github_connection_removed");
  const credential = JSON.parse(decrypt(rows[0].encrypted_credential));
  if (!credential.expiresAt || credential.expiresAt > Date.now() + 60_000) return credential.accessToken;
  if (!credential.refreshToken || (credential.refreshExpiresAt && credential.refreshExpiresAt < Date.now())) throw new Error("authorization_expired");
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST", headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, grant_type: "refresh_token", refresh_token: credential.refreshToken }), cache: "no-store", signal: AbortSignal.timeout(15_000),
  });
  const refreshed = await response.json();
  if (!response.ok || !refreshed.access_token) throw new Error("authorization_expired");
  const next = {
    accessToken: refreshed.access_token,
    refreshToken: refreshed.refresh_token ?? credential.refreshToken,
    expiresAt: Date.now() + refreshed.expires_in * 1000,
    refreshExpiresAt: refreshed.refresh_token_expires_in ? Date.now() + refreshed.refresh_token_expires_in * 1000 : credential.refreshExpiresAt,
  };
  await db(`github_connections?github_user_id=eq.${job.github_user_id}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ encrypted_credential: encrypt(JSON.stringify(next)), updated_at: new Date().toISOString() }) });
  return next.accessToken;
}

async function updateJob(id, values) {
  await db(`github_analysis_jobs?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ ...values, ...(values.status === "completed" || values.status === "failed" ? { finished_at: new Date().toISOString() } : {}) }) });
}

function publicMessage(code) {
  if (code === "rate_limited") return "GitHub API rate limit reached. Retry the analysis after the limit resets.";
  if (code === "authorization_expired" || code === "github_connection_removed") return "GitHub connection expired or was removed. Reconnect and retry.";
  if (code === "repository_access_revoked") return "The GitHub App no longer has access to this repository.";
  if (code === "tree_truncated") return "This repository tree is too large for the current analysis limit.";
  return "Analysis could not be completed. Check repository access and try again.";
}

async function run(job) {
  const token = await accessToken(job);
  const repos = await db(`github_repositories?repository_id=eq.${job.repository_id}&select=owner,name,full_name,default_branch&limit=1`);
  const links = await db(`github_user_repositories?github_user_id=eq.${job.github_user_id}&repository_id=eq.${job.repository_id}&select=repository_id&limit=1`);
  if (!repos[0] || !links[0]) throw new Error("repository_access_revoked");
  const repo = repos[0];
  await updateJob(job.id, { progress: 20, message: "Reading repository metadata" });
  const metadata = await github(`/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.name)}`, token);
  if (typeof metadata.default_branch !== "string" || !metadata.default_branch || metadata.default_branch.length > 255 || /[\u0000-\u001f\u007f]/.test(metadata.default_branch) || typeof metadata.updated_at !== "string" || Number.isNaN(Date.parse(metadata.updated_at))) throw new Error("analysis_failed");
  if (metadata.default_branch !== repo.default_branch) await db(`github_repositories?repository_id=eq.${job.repository_id}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ default_branch: metadata.default_branch, updated_at: metadata.updated_at }) });
  await updateJob(job.id, { progress: 45, message: "Inspecting the default branch file tree" });
  const latestCommit = await github(`/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.name)}/commits/${encodeURIComponent(metadata.default_branch)}`, token);
  if (typeof latestCommit.sha !== "string" || !/^[0-9a-f]{40}$/i.test(latestCommit.sha)) throw new Error("analysis_failed");
  const changedFiles = Array.isArray(latestCommit.files) ? latestCommit.files.slice(0, 500).map((file) => file.filename).filter((path) => typeof path === "string" && isSafeRepositoryPath(path)) : [];
  const commitSubject = typeof latestCommit.commit?.message === "string" ? latestCommit.commit.message.split("\n")[0].slice(0, 500) : "";
  const tree = await github(`/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.name)}/git/trees/${encodeURIComponent(latestCommit.sha)}?recursive=1`, token);
  if (!Array.isArray(tree.tree) || typeof tree.truncated !== "boolean" || typeof tree.sha !== "string" || !/^[0-9a-f]{40}$/i.test(tree.sha)) throw new Error("analysis_failed");
  if (tree.truncated || tree.tree.length > 20_000) throw new Error("tree_truncated");
  const files = tree.tree.filter((entry) => entry.type === "blob" && entry.mode !== "120000" && isSafeRepositoryPath(entry.path));
  const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mts", ".cts", ".mjs", ".cjs"]);
  const sourceFiles = files.filter((file) => {
    const leaf = file.path.slice(file.path.lastIndexOf("/") + 1);
    const dot = leaf.lastIndexOf(".");
    return dot >= 0 && sourceExtensions.has(leaf.slice(dot).toLowerCase());
  });
  const cachedRows = await db(`github_analysis_cache?repository_id=eq.${job.repository_id}&analyzed_commit=eq.${latestCommit.sha}&parser_version=eq.${encodeURIComponent(parserVersion)}&select=result&limit=1`);
  const cachedAnalysis = cachedRows[0]?.result;
  const maxFiles = 300;
  const maxFileBytes = 1024 * 1024;
  const maxTotalBytes = 20 * 1024 * 1024;
  const candidates = sourceFiles.slice(0, maxFiles).filter((entry) => Number.isSafeInteger(entry.size) && entry.size >= 0 && entry.size <= maxFileBytes);
  const inputs = [];
  const diagnostics = [];
  let downloadedBytes = 0;
  if (!cachedAnalysis) for (let index = 0; index < candidates.length; index++) {
    const file = candidates[index];
    if (downloadedBytes + file.size > maxTotalBytes) {
      diagnostics.push({ code: "repository_size_limit", message: "Remaining source files exceeded the total analysis size limit.", path: file.path, severity: "warning" });
      break;
    }
    try {
      const blob = await githubBlob(`/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.name)}/git/blobs/${encodeURIComponent(file.sha)}`, token, maxFileBytes);
      if (blob.skipped) diagnostics.push({ code: blob.reason, message: "File could not be read as supported text and was skipped.", path: file.path, severity: "warning" });
      else { inputs.push({ path: file.path, content: blob.content }); downloadedBytes += Buffer.byteLength(blob.content, "utf8"); }
    } catch (error) {
      if (error?.message === "rate_limited") throw error;
      diagnostics.push({ code: "file_fetch_failed", message: "File could not be fetched from GitHub.", path: file.path, severity: "warning" });
    }
    if (index % 20 === 0 || index === candidates.length - 1) {
      const progress = 50 + Math.floor(((index + 1) / Math.max(candidates.length, 1)) * 30);
      await updateJob(job.id, { progress, message: `Reading source files (${index + 1}/${candidates.length})` });
    }
  }
  if (!cachedAnalysis) {
    const configFile = files.find((entry) => entry.path === "tsconfig.json" && entry.mode !== "120000" && entry.size <= maxFileBytes);
    if (configFile && !inputs.some((entry) => entry.path === "tsconfig.json")) {
      try {
        const configBlob = await githubBlob(`/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.name)}/git/blobs/${encodeURIComponent(configFile.sha)}`, token, maxFileBytes);
        if (!configBlob.skipped) inputs.push({ path: "tsconfig.json", content: configBlob.content });
      } catch { diagnostics.push({ code: "config_fetch_failed", message: "TypeScript configuration could not be read.", path: "tsconfig.json", severity: "warning" }); }
    }
  }
  if (sourceFiles.length > maxFiles) diagnostics.push({ code: "file_count_limit", message: `Only the first ${maxFiles} supported source files were considered.`, severity: "warning" });
  for (const file of sourceFiles) if (Number.isSafeInteger(file.size) && file.size > maxFileBytes) diagnostics.push({ code: "file_too_large", message: "File exceeds the 1 MiB analysis limit.", path: file.path, severity: "warning" });
  await updateJob(job.id, { progress: 85, message: "Parsing source files and building dependency graph" });
  const analysis = cachedAnalysis?.graph && cachedAnalysis?.parserVersion === parserVersion
    ? cachedAnalysis
    : analyzeRepository(inputs);
  if (cachedAnalysis) inputs.length = 0;
  analysis.diagnostics.push(...diagnostics);
  analysis.skippedFileCount += diagnostics.length;
  if (analysis.status !== "failed" && diagnostics.length) analysis.status = "partial";
  const sourceFileCount = sourceFiles.length;
  await updateJob(job.id, { progress: 95, message: "Saving normalized analysis results" });
  const rawLanguages = await github(`/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.name)}/languages`, token);
  const languages = Object.fromEntries(Object.entries(rawLanguages).filter(([name, bytes]) => name.length <= 80 && Number.isSafeInteger(bytes) && bytes >= 0).slice(0, 50));
  const result = { file_count: files.length, source_file_count: sourceFileCount, analyzed_file_count: analysis.analyzedFileCount, skipped_file_count: analysis.skippedFileCount, error_count: analysis.errorCount, duration_ms: analysis.durationMs, status: analysis.status, languages, truncated: false };
  if (!cachedAnalysis) {
    await db("github_analysis_cache?on_conflict=repository_id,analyzed_commit,parser_version", {
      method: "POST", headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
      body: JSON.stringify({ repository_id: job.repository_id, analyzed_commit: latestCommit.sha, parser_version: parserVersion, result: analysis }),
    });
  }
  await db("github_analyses?on_conflict=job_id", {
    method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ job_id: job.id, github_user_id: job.github_user_id, repository_id: job.repository_id, default_branch: metadata.default_branch, analyzed_commit: latestCommit.sha, commit_subject: commitSubject, file_count: files.length, source_file_count: sourceFileCount, language_totals: languages, graph: analysis.graph, diagnostics: analysis.diagnostics, changed_files: changedFiles, analysis_status: analysis.status, analyzed_file_count: analysis.analyzedFileCount, skipped_file_count: analysis.skippedFileCount, error_count: analysis.errorCount, duration_ms: analysis.durationMs, parser_version: analysis.parserVersion }),
  });
  await updateJob(job.id, { status: "completed", progress: 100, message: "Analysis complete", result });
}

async function processOne() {
  const claimed = await db("rpc/claim_github_analysis_job", { method: "POST", body: "{}" });
  const job = Array.isArray(claimed) ? claimed[0] : claimed;
  if (!job) return false;
  try {
    await run(job);
  } catch (error) {
    const code = error instanceof Error ? error.message : "analysis_failed";
    const allowed = new Set(["rate_limited", "authorization_expired", "github_connection_removed", "repository_access_revoked", "tree_truncated"]);
    const safeCode = allowed.has(code) ? code : "analysis_failed";
    await updateJob(job.id, { status: "failed", progress: 100, message: publicMessage(safeCode), error_code: safeCode });
  }
  return true;
}

const once = process.argv.includes("--once");
const pollMs = Math.max(1000, Number(process.env.GITHUB_WORKER_POLL_MS) || 4000);
do {
  const foundWork = await processOne();
  if (once) break;
  if (!foundWork) await new Promise((resolve) => setTimeout(resolve, pollMs));
} while (true);
