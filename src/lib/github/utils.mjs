export function isSafeRepositoryPath(path) {
  return typeof path === "string" && path.length > 0 && path.length <= 1024 && !path.startsWith("/") && !path.includes("\\") && path.split("/").every((part) => part && part !== "." && part !== "..");
}

export function nextGitHubPage(link) {
  const match = typeof link === "string" ? link.match(/<([^>]+)>;\s*rel="next"/) : null;
  if (!match?.[1]) return null;
  try {
    const url = new URL(match[1]);
    if (url.origin !== "https://api.github.com") return null;
    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}
