export function githubConfigured() {
  const valuesPresent = Boolean(
    process.env.GITHUB_APP_CLIENT_ID &&
      process.env.GITHUB_APP_CLIENT_SECRET &&
      process.env.GITHUB_APP_SLUG &&
      process.env.NEXT_PUBLIC_APP_URL &&
      process.env.SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY &&
      process.env.CODEDNA_TOKEN_ENCRYPTION_KEY &&
      process.env.CODEDNA_SESSION_SECRET,
  );
  if (!valuesPresent) return false;
  try {
    const appUrl = new URL(process.env.NEXT_PUBLIC_APP_URL!);
    const validUrl = appUrl.pathname === "/" && !appUrl.search && !appUrl.hash && (appUrl.protocol === "https:" || (process.env.NODE_ENV !== "production" && appUrl.hostname === "localhost" && appUrl.protocol === "http:"));
    const supabaseUrl = new URL(process.env.SUPABASE_URL!);
    const validSupabaseUrl = supabaseUrl.pathname === "/" && !supabaseUrl.search && !supabaseUrl.hash && !supabaseUrl.username && !supabaseUrl.password && (supabaseUrl.protocol === "https:" || (process.env.NODE_ENV !== "production" && ["localhost", "127.0.0.1"].includes(supabaseUrl.hostname) && supabaseUrl.protocol === "http:"));
    const encryptionLength = Buffer.from(process.env.CODEDNA_TOKEN_ENCRYPTION_KEY!, "base64").length;
    const validSlug = /^[a-z0-9-]+$/.test(process.env.GITHUB_APP_SLUG!);
    return validUrl && validSupabaseUrl && validSlug && encryptionLength === 32 && Buffer.byteLength(process.env.CODEDNA_SESSION_SECRET!) >= 32;
  } catch {
    return false;
  }
}

export function requireGithubConfig() {
  if (!githubConfigured()) throw new Error("GitHub integration is not configured.");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const parsedAppUrl = new URL(appUrl);
  const supabaseUrl = new URL(process.env.SUPABASE_URL!);
  if ((parsedAppUrl.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && parsedAppUrl.hostname === "localhost" && parsedAppUrl.protocol === "http:")) || parsedAppUrl.pathname !== "/" || parsedAppUrl.search || parsedAppUrl.hash) {
    throw new Error("NEXT_PUBLIC_APP_URL must be an HTTPS origin (localhost is allowed in development).");
  }
  if (supabaseUrl.pathname !== "/" || supabaseUrl.search || supabaseUrl.hash || supabaseUrl.username || supabaseUrl.password || (supabaseUrl.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && ["localhost", "127.0.0.1"].includes(supabaseUrl.hostname) && supabaseUrl.protocol === "http:"))) {
    throw new Error("SUPABASE_URL must be an HTTPS origin (localhost is allowed in development).");
  }
  return {
    clientId: process.env.GITHUB_APP_CLIENT_ID!,
    clientSecret: process.env.GITHUB_APP_CLIENT_SECRET!,
    appSlug: process.env.GITHUB_APP_SLUG!,
    appUrl: appUrl.replace(/\/$/, ""),
    supabaseUrl: process.env.SUPABASE_URL!.replace(/\/$/, ""),
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  };
}

export function missingConfiguration() {
  const fields = [
    ["GITHUB_APP_CLIENT_ID", process.env.GITHUB_APP_CLIENT_ID],
    ["GITHUB_APP_CLIENT_SECRET", process.env.GITHUB_APP_CLIENT_SECRET],
    ["GITHUB_APP_SLUG", process.env.GITHUB_APP_SLUG],
    ["NEXT_PUBLIC_APP_URL", process.env.NEXT_PUBLIC_APP_URL],
    ["SUPABASE_URL", process.env.SUPABASE_URL],
    ["SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY],
    ["CODEDNA_TOKEN_ENCRYPTION_KEY", process.env.CODEDNA_TOKEN_ENCRYPTION_KEY],
    ["CODEDNA_SESSION_SECRET", process.env.CODEDNA_SESSION_SECRET],
  ] as const;
  const missing: string[] = fields.filter(([, value]) => !value).map(([name]) => name);
  if (process.env.NEXT_PUBLIC_APP_URL) {
    try {
      const appUrl = new URL(process.env.NEXT_PUBLIC_APP_URL);
      if (!(appUrl.pathname === "/" && !appUrl.search && !appUrl.hash && (appUrl.protocol === "https:" || (process.env.NODE_ENV !== "production" && appUrl.hostname === "localhost" && appUrl.protocol === "http:")))) missing.push("NEXT_PUBLIC_APP_URL (HTTPS origin required)");
    } catch { missing.push("NEXT_PUBLIC_APP_URL (valid origin required)"); }
  }
  if (process.env.SUPABASE_URL) {
    try {
      const supabaseUrl = new URL(process.env.SUPABASE_URL);
      if (!(supabaseUrl.pathname === "/" && !supabaseUrl.search && !supabaseUrl.hash && !supabaseUrl.username && !supabaseUrl.password && (supabaseUrl.protocol === "https:" || (process.env.NODE_ENV !== "production" && ["localhost", "127.0.0.1"].includes(supabaseUrl.hostname) && supabaseUrl.protocol === "http:")))) missing.push("SUPABASE_URL (HTTPS origin required)");
    } catch { missing.push("SUPABASE_URL (valid origin required)"); }
  }
  if (process.env.CODEDNA_TOKEN_ENCRYPTION_KEY && Buffer.from(process.env.CODEDNA_TOKEN_ENCRYPTION_KEY, "base64").length !== 32) missing.push("CODEDNA_TOKEN_ENCRYPTION_KEY (base64 32-byte key required)");
  if (process.env.CODEDNA_SESSION_SECRET && Buffer.byteLength(process.env.CODEDNA_SESSION_SECRET) < 32) missing.push("CODEDNA_SESSION_SECRET (minimum 32 bytes required)");
  if (process.env.GITHUB_APP_SLUG && !/^[a-z0-9-]+$/.test(process.env.GITHUB_APP_SLUG)) missing.push("GITHUB_APP_SLUG (GitHub App slug required)");
  return missing;
}
