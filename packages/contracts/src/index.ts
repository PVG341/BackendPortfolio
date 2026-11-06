export const algorithms = ['fixed', 'sliding'] as const;

export type Algorithm = (typeof algorithms)[number];

export interface SessionConfig {
  limit: number;
  windowSeconds: number;
}

export interface RateLimitRequest {
  token: string;
  algorithm: Algorithm;
}

export interface SessionTokenRequest {
  token: string;
}

export interface RateLimitDecision {
  allowed: boolean;
  algorithm: Algorithm;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterMs: number;
}

export const sqlInjectionModes = ['unsafe', 'safe'] as const;

export type SqlInjectionMode = (typeof sqlInjectionModes)[number];

export interface SqlInjectionRequest {
  mode: SqlInjectionMode;
  username: string;
}

export interface SqlDemoRow {
  id: number;
  username: string;
  role: string;
}

export interface SqlInjectionResponse {
  mode: SqlInjectionMode;
  rows: SqlDemoRow[];
  rowCount: number;
  durationMs: number;
}

export interface ContactRequest {
  name: string;
  email: string;
  message: string;
  website?: string;
}

export interface ContactResponse {
  status: 'accepted';
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' && value !== null && Object.getPrototypeOf(value) === Object.prototype
  );
}

function hasExactKeys(value: Record<string, unknown>, expectedKeys: readonly string[]): boolean {
  const keys = Object.keys(value);

  return (
    keys.length === expectedKeys.length &&
    expectedKeys.every((expectedKey) => Object.prototype.hasOwnProperty.call(value, expectedKey))
  );
}

export function parseSessionConfig(value: unknown): SessionConfig | null {
  if (!isPlainRecord(value) || !hasExactKeys(value, ['limit', 'windowSeconds'])) {
    return null;
  }

  const { limit, windowSeconds } = value;

  if (
    typeof limit !== 'number' ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 20 ||
    typeof windowSeconds !== 'number' ||
    !Number.isInteger(windowSeconds) ||
    windowSeconds < 1 ||
    windowSeconds > 60
  ) {
    return null;
  }

  return { limit, windowSeconds };
}

export function parseSessionToken(value: unknown): string | null {
  if (typeof value !== 'string' || !/^[a-f0-9]{64}$/.test(value)) {
    return null;
  }

  return value;
}

export function parseRateLimitRequest(value: unknown): RateLimitRequest | null {
  if (!isPlainRecord(value) || !hasExactKeys(value, ['token', 'algorithm'])) {
    return null;
  }

  const token = parseSessionToken(value.token);

  if (token === null || (value.algorithm !== 'fixed' && value.algorithm !== 'sliding')) {
    return null;
  }

  return {
    token,
    algorithm: value.algorithm,
  };
}

export function parseSessionTokenRequest(value: unknown): SessionTokenRequest | null {
  if (!isPlainRecord(value) || !hasExactKeys(value, ['token'])) {
    return null;
  }

  const token = parseSessionToken(value.token);

  return token === null ? null : { token };
}

const SQL_USERNAME_PATTERN = /^[\x20-\x7E]+$/;
const CONTACT_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001F\u007F]/;
const CONTACT_MESSAGE_FORBIDDEN_PATTERN = /[\u0000-\u0008\u000B-\u001F\u007F]/;

const contactAllowedKeys = ['name', 'email', 'message', 'website'] as const;
const contactRequiredKeys = ['name', 'email', 'message'] as const;

function codePointLength(value: string): number {
  return [...value].length;
}

function hasOnlyAllowedKeys(
  value: Record<string, unknown>,
  allowedKeys: readonly string[],
): boolean {
  return Object.keys(value).every((key) => allowedKeys.includes(key));
}

export function parseSqlInjectionRequest(value: unknown): SqlInjectionRequest | null {
  if (!isPlainRecord(value) || !hasExactKeys(value, ['mode', 'username'])) {
    return null;
  }

  const { mode, username } = value;

  if (mode !== 'unsafe' && mode !== 'safe') {
    return null;
  }

  if (typeof username !== 'string') {
    return null;
  }

  const trimmedUsername = username.trim();

  if (
    trimmedUsername.length < 1 ||
    trimmedUsername.length > 64 ||
    !SQL_USERNAME_PATTERN.test(trimmedUsername) ||
    trimmedUsername.includes(';')
  ) {
    return null;
  }

  return { mode, username: trimmedUsername };
}

export function parseContactRequest(value: unknown): ContactRequest | null {
  if (!isPlainRecord(value) || !hasOnlyAllowedKeys(value, contactAllowedKeys)) {
    return null;
  }

  if (!contactRequiredKeys.every((key) => Object.prototype.hasOwnProperty.call(value, key))) {
    return null;
  }

  const { name, email, message, website } = value;

  if (typeof name !== 'string' || typeof email !== 'string' || typeof message !== 'string') {
    return null;
  }

  const trimmedName = name.trim();
  const nameLength = codePointLength(trimmedName);

  if (nameLength < 1 || nameLength > 100 || CONTROL_CHARACTER_PATTERN.test(trimmedName)) {
    return null;
  }

  const trimmedEmail = email.trim();

  if (
    trimmedEmail.length > 254 ||
    CONTROL_CHARACTER_PATTERN.test(trimmedEmail) ||
    !CONTACT_EMAIL_PATTERN.test(trimmedEmail)
  ) {
    return null;
  }

  const normalizedMessage = message.replace(/\r\n?/g, '\n').trim();
  const messageLength = codePointLength(normalizedMessage);

  if (
    messageLength < 1 ||
    messageLength > 2000 ||
    CONTACT_MESSAGE_FORBIDDEN_PATTERN.test(normalizedMessage)
  ) {
    return null;
  }

  if (website !== undefined) {
    if (typeof website !== 'string' || website.length > 200) {
      return null;
    }

    return { name: trimmedName, email: trimmedEmail, message: normalizedMessage, website };
  }

  return { name: trimmedName, email: trimmedEmail, message: normalizedMessage };
}
