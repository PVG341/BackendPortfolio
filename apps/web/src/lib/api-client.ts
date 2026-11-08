import type {
  Algorithm,
  ContactRequest,
  ContactResponse,
  RateLimitDecision,
  SessionConfig,
  SqlInjectionMode,
  SqlInjectionResponse,
} from '@portfolio/contracts';
import { parseApiResponse, type ApiResponse } from './api-response';

export type { RateLimitDecision } from '@portfolio/contracts';

export interface HealthResponse {
  status: string;
  service: string;
  timestamp: string;
}

export interface SessionResponse {
  token: string;
  config: SessionConfig;
  expiresAt: number;
}

function apiUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '');

  if (!url) {
    throw new Error('NEXT_PUBLIC_API_URL is not configured');
  }

  return url;
}

async function request<T>(
  method: 'POST' | 'DELETE',
  path: string,
  body: unknown,
): Promise<ApiResponse<T>> {
  const startedAt = performance.now();

  const response = await fetch(`${apiUrl()}${path}`, {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  });

  return parseApiResponse<T>(response, Math.round(performance.now() - startedAt));
}

export function getReadiness(): Promise<{ ok: boolean; status: number }> {
  return fetch(`${apiUrl()}/health/ready`, {
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  }).then((response) => ({ ok: response.ok, status: response.status }));
}

export function createRateLimitSession(limit: number, windowSeconds: number) {
  return request<SessionResponse>('POST', '/playground/rate-limit/session', {
    limit,
    windowSeconds,
  });
}

export function sendRateLimitRequest(token: string, algorithm: Algorithm) {
  return request<RateLimitDecision>('POST', '/playground/rate-limit/request', {
    token,
    algorithm,
  });
}

export function resetRateLimitSession(token: string) {
  return request<null>('DELETE', '/playground/rate-limit/session', { token });
}

export function runSqlInjection(mode: SqlInjectionMode, username: string) {
  return request<SqlInjectionResponse>('POST', '/playground/sql-injection/query', {
    mode,
    username,
  });
}

export function sendContact(payload: ContactRequest) {
  return request<ContactResponse>('POST', '/contact', payload);
}
