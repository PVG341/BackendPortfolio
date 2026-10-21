export interface RateLimitHeaders {
  limit: number | null;
  remaining: number | null;
  resetAtSeconds: number | null;
  retryAfterSeconds: number | null;
}

export interface ApiResponse<T> {
  status: number;
  ok: boolean;
  durationMs: number;
  body: T;
  rateLimit: RateLimitHeaders;
}

function readIntegerHeader(headers: Headers, name: string): number | null {
  const value = headers.get(name);

  if (value === null || !/^\d+$/.test(value)) {
    return null;
  }

  return Number(value);
}

export async function parseApiResponse<T>(
  response: Response,
  durationMs: number,
): Promise<ApiResponse<T>> {
  return {
    status: response.status,
    ok: response.ok,
    durationMs,
    body: (await response.json()) as T,
    rateLimit: {
      limit: readIntegerHeader(response.headers, 'x-ratelimit-limit'),
      remaining: readIntegerHeader(response.headers, 'x-ratelimit-remaining'),
      resetAtSeconds: readIntegerHeader(response.headers, 'x-ratelimit-reset'),
      retryAfterSeconds: readIntegerHeader(response.headers, 'retry-after'),
    },
  };
}