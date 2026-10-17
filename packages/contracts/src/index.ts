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
