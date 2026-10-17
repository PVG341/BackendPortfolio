import { describe, expect, it } from 'vitest';
import {
  parseSessionTokenRequest,
  parseRateLimitRequest,
  parseSessionConfig,
  parseSessionToken,
} from '../src/index.ts';

const validToken = 'a'.repeat(64);

describe('parseSessionConfig', () => {
  it('accepts integer limit and windowSeconds in the allowed range', () => {
    expect(
      parseSessionConfig({
        limit: 5,
        windowSeconds: 10,
      }),
    ).toEqual({
      limit: 5,
      windowSeconds: 10,
    });
  });

  it.each([
    { limit: 0, windowSeconds: 10 },
    { limit: 21, windowSeconds: 10 },
    { limit: 5.5, windowSeconds: 10 },
    { limit: 5, windowSeconds: 0 },
    { limit: 5, windowSeconds: 61 },
    { limit: 5, windowSeconds: 10.5 },
    { limit: '5', windowSeconds: 10 },
    { limit: 5, windowSeconds: 10, extra: true },
    {},
    null,
  ])('rejects malformed session config %#', (input) => {
    expect(parseSessionConfig(input)).toBeNull();
  });
});

describe('parseSessionToken', () => {
  it('accepts exactly 64 lowercase hexadecimal characters', () => {
    expect(parseSessionToken(validToken)).toBe(validToken);
  });

  it.each(['', 'a'.repeat(63), 'a'.repeat(65), 'A'.repeat(64), 'z'.repeat(64), 123, null])(
    'rejects malformed token %#',
    (input) => {
      expect(parseSessionToken(input)).toBeNull();
    },
  );
});

describe('parseRateLimitRequest', () => {
  it('accepts a fixed-window request', () => {
    expect(
      parseRateLimitRequest({
        token: validToken,
        algorithm: 'fixed',
      }),
    ).toEqual({
      token: validToken,
      algorithm: 'fixed',
    });
  });

  it('accepts a sliding-window request', () => {
    expect(
      parseRateLimitRequest({
        token: validToken,
        algorithm: 'sliding',
      }),
    ).toEqual({
      token: validToken,
      algorithm: 'sliding',
    });
  });

  it.each([
    { token: validToken, algorithm: 'unknown' },
    { token: 'short', algorithm: 'fixed' },
    { token: validToken },
    { algorithm: 'fixed' },
    { token: validToken, algorithm: 'fixed', extra: true },
    null,
  ])('rejects malformed rate-limit request %#', (input) => {
    expect(parseRateLimitRequest(input)).toBeNull();
  });
});
describe('parseSessionTokenRequest', () => {
  it('accepts a token-only request', () => {
    expect(
      parseSessionTokenRequest({
        token: validToken,
      }),
    ).toEqual({
      token: validToken,
    });
  });

  it.each([{}, { token: 'short' }, { token: validToken, extra: true }, null])(
    'rejects malformed reset request %#',
    (input) => {
      expect(parseSessionTokenRequest(input)).toBeNull();
    },
  );
});
