import { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const stateTtlSeconds = 10 * 60;
const sessionTtlSeconds = 7 * 24 * 60 * 60;

function secret(name: string, minimumLength = 32) {
  const value = process.env[name];
  if (!value || Buffer.byteLength(value) < minimumLength) throw new Error(`${name} is not configured correctly.`);
  return value;
}

function mac(value: string, key: string) {
  return createHmac("sha256", key).update(value).digest("base64url");
}

export function createOAuthState(now = Date.now()) {
  const state = randomBytes(32).toString("base64url");
  const expires = Math.floor(now / 1000) + stateTtlSeconds;
  const payload = `${state}.${expires}`;
  return { state, cookie: `${payload}.${mac(payload, secret("CODEDNA_SESSION_SECRET"))}`, expires };
}

export function verifyOAuthState(state: string | null, cookie: string | undefined, now = Date.now()) {
  if (!state || state.length > 64 || !cookie || cookie.length > 256) return false;
  const parts = cookie.split(".");
  if (parts.length !== 3) return false;
  const [cookieState, expiresRaw, signature] = parts;
  const expires = Number(expiresRaw);
  if (!cookieState || !signature || !Number.isSafeInteger(expires) || expires < Math.floor(now / 1000)) return false;
  const payload = `${cookieState}.${expiresRaw}`;
  const expected = Buffer.from(mac(payload, secret("CODEDNA_SESSION_SECRET")));
  const actual = Buffer.from(signature);
  const expectedState = Buffer.from(cookieState);
  const suppliedState = Buffer.from(state);
  return expectedState.length === suppliedState.length && timingSafeEqual(expectedState, suppliedState) && actual.length === expected.length && timingSafeEqual(actual, expected);
}

export type UserSession = { githubUserId: number; login: string; expires: number };

export function createSession(user: { id: number; login: string }, now = Date.now()) {
  const expires = Math.floor(now / 1000) + sessionTtlSeconds;
  const payload = Buffer.from(JSON.stringify({ githubUserId: user.id, login: user.login, expires })).toString("base64url");
  return `${payload}.${mac(payload, secret("CODEDNA_SESSION_SECRET"))}`;
}

export function readSession(value: string | undefined, now = Date.now()): UserSession | null {
  if (!value || value.length > 2048) return null;
  const [payload, signature, ...rest] = value.split(".");
  if (!payload || !signature || rest.length) return null;
  const expected = Buffer.from(mac(payload, secret("CODEDNA_SESSION_SECRET")));
  const actual = Buffer.from(signature);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as UserSession;
    if (!Number.isSafeInteger(parsed.githubUserId) || typeof parsed.login !== "string" || !Number.isSafeInteger(parsed.expires) || parsed.expires <= Math.floor(now / 1000)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function encryptionKey() {
  const value = Buffer.from(secret("CODEDNA_TOKEN_ENCRYPTION_KEY"), "base64");
  if (value.length !== 32) throw new Error("CODEDNA_TOKEN_ENCRYPTION_KEY must be a base64-encoded 32-byte key.");
  return value;
}

export function encryptToken(plaintext: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return `v1.${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${ciphertext.toString("base64url")}`;
}

export function decryptToken(value: string) {
  const [version, ivRaw, tagRaw, ciphertextRaw, ...rest] = value.split(".");
  if (version !== "v1" || !ivRaw || !tagRaw || !ciphertextRaw || rest.length) throw new Error("Stored GitHub credential is invalid.");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivRaw, "base64url"));
  decipher.setAuthTag(Buffer.from(tagRaw, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(ciphertextRaw, "base64url")), decipher.final()]).toString("utf8");
}
