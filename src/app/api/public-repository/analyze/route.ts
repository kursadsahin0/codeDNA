import { NextResponse } from "next/server";
import { analyzeRepository } from "@/lib/analysis/engine.mjs";
import { isSafeRepositoryPath } from "@/lib/github/utils.mjs";

type TreeEntry = { path?: unknown; type?: unknown; size?: unknown; sha?: unknown };
type RepoInfo = { full_name?: unknown; private?: unknown; default_branch?: unknown; html_url?: unknown; description?: unknown };
type CommitInfo = { sha?: unknown; html_url?: unknown; author?: { login?: unknown } | null; commit?: { message?: unknown; author?: { name?: unknown; date?: unknown } | null } };

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

function parsePublicGitHubUrl(value: unknown) {
  if (typeof value !== "string" || value.length > 500) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.hostname !== "github.com" || url.username || url.password || url.search || url.hash) return null;
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length !== 2) return null;
    const owner = parts[0];
    const repo = parts[1].replace(/\.git$/i, "");
    if (!/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/.test(owner) || !/^[A-Za-z0-9_.-]{1,100}$/.test(repo) || repo === "." || repo === "..") return null;
    return { owner, repo };
  } catch { return null; }
}

async function githubJson<T>(url: string) {
  const response = await fetch(url, { headers: { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "CodeDNA-public-repository-analyzer" }, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(7000) });
  if (response.status === 404) throw new Error("Repository not found or not public.");
  if (response.status === 403 || response.status === 429) throw new Error("GitHub rate limit reached. Wait a little and try again.");
  if (!response.ok) throw new Error("GitHub could not provide this repository right now.");
  return response.json() as Promise<T>;
}

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return jsonError("Request origin could not be verified.", 403);
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const now = Date.now();
  const rate = anonymousLimits.get(ip);
  if (rate && rate.until > now && rate.count >= 3) return jsonError("Anonymous analysis limit reached. Try again in a minute.", 429);
  anonymousLimits.set(ip, !rate || rate.until <= now ? { count: 1, until: now + 60_000 } : { ...rate, count: rate.count + 1 });
  if (anonymousLimits.size > 1000) for (const [key, value] of anonymousLimits) if (value.until <= now) anonymousLimits.delete(key);

  let body: { url?: unknown };
  try {
    const raw = await request.text();
    if (raw.length > 1000) return jsonError("Request body is too large.", 413);
    body = JSON.parse(raw) as { url?: unknown };
  } catch { return jsonError("Enter a valid public GitHub repository link.", 400); }
  const parsed = parsePublicGitHubUrl(body.url);
  if (!parsed) return jsonError("Use a public GitHub repository URL such as https://github.com/owner/repository.", 400);

  try {
    const api = "https://api.github.com";
    const repo = await githubJson<RepoInfo>(`${api}/repos/${encodeURIComponent(parsed.owner)}/${encodeURIComponent(parsed.repo)}`);
    if (repo.private === true || typeof repo.default_branch !== "string" || typeof repo.full_name !== "string") return jsonError("Only public repositories can be analyzed without connecting GitHub.", 403);
    const tree = await githubJson<{ tree?: TreeEntry[]; truncated?: boolean }>(`${api}/repos/${encodeURIComponent(parsed.owner)}/${encodeURIComponent(parsed.repo)}/git/trees/${encodeURIComponent(repo.default_branch)}?recursive=1`);
    if (!Array.isArray(tree.tree)) return jsonError("GitHub returned an unreadable repository tree.", 502);
    const commitRows = await githubJson<CommitInfo[]>(`${api}/repos/${encodeURIComponent(parsed.owner)}/${encodeURIComponent(parsed.repo)}/commits?sha=${encodeURIComponent(repo.default_branch)}&per_page=10`);
    const commits = Array.isArray(commitRows)
      ? commitRows.flatMap((item) => {
          if (typeof item.sha !== "string" || typeof item.html_url !== "string") return [];
          const message = typeof item.commit?.message === "string" ? item.commit.message : "";
          const [subjectLine = "", ...rest] = message.split("\n");
          return [
            {
              sha: item.sha,
              subject: subjectLine || "(no commit message)",
              body: rest.join("\n").trim(),
              author:
                typeof item.author?.login === "string"
                  ? item.author.login
                  : typeof item.commit?.author?.name === "string"
                    ? item.commit.author.name
                    : "Unknown author",
              authoredAt: typeof item.commit?.author?.date === "string" ? item.commit.author.date : "",
              url: item.html_url,
            },
          ];
        })
      : [];
    const supported = tree.tree.filter((entry) => typeof entry.path === "string" && entry.type === "blob" && typeof entry.sha === "string" && Number.isSafeInteger(entry.size) && (entry.size as number) <= 262_144 && isSafeRepositoryPath(entry.path) && /\.(?:ts|tsx|js|jsx|mts|cts|mjs|cjs)$/.test(entry.path)).slice(0, 24);
    const files: Array<{ path: string; content: string }> = [];
    const started = Date.now();
    for (let i = 0; i < supported.length && Date.now() - started < 25_000; i += 4) {
      const batch = supported.slice(i, i + 4);
      const results = await Promise.all(batch.map(async (entry) => {
        const filePath = entry.path as string;
        const rawPath = filePath.split("/").map(encodeURIComponent).join("/");
        const response = await fetch(`https://raw.githubusercontent.com/${encodeURIComponent(parsed.owner)}/${encodeURIComponent(parsed.repo)}/${encodeURIComponent(repo.default_branch as string)}/${rawPath}`, { cache: "no-store", redirect: "error", signal: AbortSignal.timeout(7000), headers: { "User-Agent": "CodeDNA-public-repository-analyzer" } });
        if (!response.ok) return null;
        if (!response.body) return null;
        const reader = response.body.getReader();
        const chunks: Uint8Array[] = [];
        let length = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          length += value.byteLength;
          if (length > 262_144) { await reader.cancel(); return null; }
          chunks.push(value);
        }
        const content = new TextDecoder("utf-8", { fatal: false }).decode(Buffer.concat(chunks));
        return { path: filePath, content };
      }));
      files.push(...results.filter((file): file is { path: string; content: string } => file !== null));
      if (files.reduce((sum, file) => sum + new TextEncoder().encode(file.content).byteLength, 0) > 3 * 1024 * 1024) break;
    }
    const analysis = analyzeRepository(files, { maxFileBytes: 262_144 });
    return NextResponse.json({ repository: { name: repo.full_name, url: repo.html_url, branch: repo.default_branch, description: typeof repo.description === "string" ? repo.description : null }, commits, analyzedCommit: commits[0]?.sha ?? null, commitSubject: commits[0]?.subject ?? null, truncated: Boolean(tree.truncated) || supported.length === 24 || Date.now() - started >= 25_000, sourceFileCount: files.length, ...analysis }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Public repository analysis failed.", 502);
  }
}

const anonymousLimits = new Map<string, { count: number; until: number }>();
