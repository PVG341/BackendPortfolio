import { parseApiResponse, type ApiResponse } from './api-response';

export interface HealthResponse {
  status: string;
  service: string;
  timestamp: string;
}

export interface SessionResponse {
  token: string;
  config: { limit: number; windowSeconds: number };
  expiresAt: number;
}

export interface RateLimitDecision {
  allowed: boolean;
  algorithm: 'fixed' | 'sliding';
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterMs: number;
}

function apiUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) throw new Error('NEXT_PUBLIC_API_URL is not configured');
  return url;
}

async function post<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
  const startedAt = performance.now();
  const response = await fetch(`${apiUrl()}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  });
  return parseApiResponse<T>(response, Math.round(performance.now() - startedAt));
}

export async function getHealth(): Promise<HealthResponse> {
  const response = await fetch(`${apiUrl()}/health`, { cache: 'no-store', signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new Error(`API returned HTTP ${response.status}`);
  return response.json() as Promise<HealthResponse>;
}

export function createRateLimitSession(limit: number, windowSeconds: number) {
  return post<SessionResponse>('/playground/rate-limit/session', { limit, windowSeconds });
}

export function sendRateLimitRequest(token: string, algorithm: 'fixed' | 'sliding') {
  return post<RateLimitDecision>('/playground/rate-limit/request', { token, algorithm });
}