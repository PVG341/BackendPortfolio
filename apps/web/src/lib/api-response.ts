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

async function readBody(response: Response): Promise<unknown> {
  const text = await response.text();

  if (text.length === 0) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { message: 'Unexpected API response' };
  }
}

export function readErrorMessage(body: unknown, fallback: string): string {
  if (typeof body !== 'object' || body === null || !('message' in body)) {
    return fallback;
  }

  const message = (body as { message?: unknown }).message;

  return typeof message === 'string' && message.length > 0 ? message : fallback;
}

export async function parseApiResponse<T>(
  response: Response,
  durationMs: number,
): Promise<ApiResponse<T>> {
  return {
    status: response.status,
    ok: response.ok,
    durationMs,
    body: (await readBody(response)) as T,
    rateLimit: {
      limit: readIntegerHeader(response.headers, 'x-ratelimit-limit'),
      remaining: readIntegerHeader(response.headers, 'x-ratelimit-remaining'),
      resetAtSeconds: readIntegerHeader(response.headers, 'x-ratelimit-reset'),
      retryAfterSeconds: readIntegerHeader(response.headers, 'retry-after'),
    },
  };
}
