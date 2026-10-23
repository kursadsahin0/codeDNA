/** Emit metadata-only server logs. Never pass tokens, request bodies, repository content, or raw errors. */
export function logServerError(event: string, error: unknown) {
  const safeEvent = /^[a-z0-9._-]{1,64}$/i.test(event) ? event : "server.error";
  const errorType = error instanceof Error ? error.name : "UnknownError";
  const safeType = /^[a-zA-Z0-9_]{1,48}$/.test(errorType) ? errorType : "UnknownError";
  console.error(JSON.stringify({ level: "error", event: safeEvent, errorType: safeType, timestamp: new Date().toISOString() }));
}

export function logRequestError(error: unknown, metadata: { method: string; route: string; routerKind: string; routeType: string }) {
  const errorType = error instanceof Error ? error.name : "UnknownError";
  const safeType = /^[a-zA-Z0-9_]{1,48}$/.test(errorType) ? errorType : "UnknownError";
  const method = /^(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)$/.test(metadata.method) ? metadata.method : "UNKNOWN";
  const route = /^\/[a-zA-Z0-9/_()[\]-]{0,159}$/.test(metadata.route) ? metadata.route : "/unknown";
  const routerKind = metadata.routerKind === "Pages Router" ? "pages" : "app";
  const routeType = /^(render|route|action|proxy)$/.test(metadata.routeType) ? metadata.routeType : "unknown";
  console.error(JSON.stringify({ level: "error", event: "request.failed", errorType: safeType, method, route, routerKind, routeType, timestamp: new Date().toISOString() }));
}
