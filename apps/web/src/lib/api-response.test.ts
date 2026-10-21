import { describe, expect, it } from 'vitest';
import { parseApiResponse } from './api-response.js';

describe('parseApiResponse', () => {
  it('preserves a blocked response, timing, and rate-limit headers', async () => {
    const response = new Response(JSON.stringify({ allowed: false, retryAfterMs: 1300 }), {
      status: 429,
      headers: {
        'content-type': 'application/json',
        'retry-after': '2',
        'x-ratelimit-limit': '5',
        'x-ratelimit-remaining': '0',
        'x-ratelimit-reset': '1792136500',
      },
    });

    await expect(parseApiResponse(response, 24)).resolves.toEqual({
      status: 429,
      ok: false,
      durationMs: 24,
      body: { allowed: false, retryAfterMs: 1300 },
      rateLimit: {
        limit: 5,
        remaining: 0,
        resetAtSeconds: 1792136500,
        retryAfterSeconds: 2,
      },
    });
  });
});