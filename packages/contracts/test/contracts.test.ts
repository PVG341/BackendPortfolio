import { describe, expect, it } from 'vitest';
import {
  parseContactRequest,
  parseSessionTokenRequest,
  parseRateLimitRequest,
  parseSessionConfig,
  parseSessionToken,
  parseSqlInjectionRequest,
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

describe('parseSqlInjectionRequest', () => {
  it('accepts unsafe mode with a normal username', () => {
    expect(parseSqlInjectionRequest({ mode: 'unsafe', username: 'alice' })).toEqual({
      mode: 'unsafe',
      username: 'alice',
    });
  });

  it('accepts safe mode with an injection payload', () => {
    expect(parseSqlInjectionRequest({ mode: 'safe', username: "' OR '1'='1' --" })).toEqual({
      mode: 'safe',
      username: "' OR '1'='1' --",
    });
  });

  it('trims surrounding whitespace', () => {
    expect(parseSqlInjectionRequest({ mode: 'unsafe', username: '  alice  ' })).toEqual({
      mode: 'unsafe',
      username: 'alice',
    });
  });

  it('accepts exactly 64 printable characters', () => {
    const username = 'a'.repeat(64);

    expect(parseSqlInjectionRequest({ mode: 'safe', username })).toEqual({
      mode: 'safe',
      username,
    });
  });

  it.each([
    {},
    { mode: 'unsafe' },
    { username: 'alice' },
    { mode: 'drop', username: 'alice' },
    { mode: 'unsafe', username: '' },
    { mode: 'unsafe', username: '   ' },
    { mode: 'unsafe', username: 'a'.repeat(65) },
    { mode: 'unsafe', username: 'alice;' },
    { mode: 'unsafe', username: 'ali\nce' },
    { mode: 'unsafe', username: 'ali\tce' },
    { mode: 'unsafe', username: 123 },
    { mode: 'unsafe', username: 'alice', sql: 'select 1' },
    null,
    [],
  ])('rejects malformed SQL request %#', (input) => {
    expect(parseSqlInjectionRequest(input)).toBeNull();
  });
});

describe('parseContactRequest', () => {
  it('accepts required fields and normalizes whitespace', () => {
    expect(
      parseContactRequest({
        name: ' Alice ',
        email: ' alice@example.com ',
        message: ' Hello\nWorld ',
      }),
    ).toEqual({
      name: 'Alice',
      email: 'alice@example.com',
      message: 'Hello\nWorld',
    });
  });

  it('normalizes CRLF line endings in the message', () => {
    const request = parseContactRequest({
      name: 'Alice',
      email: 'alice@example.com',
      message: 'Line 1\r\nLine 2',
    });

    expect(request?.message).toBe('Line 1\nLine 2');
  });

  it('accepts an empty or filled honeypot', () => {
    expect(
      parseContactRequest({
        name: 'Alice',
        email: 'alice@example.com',
        message: 'Hello',
        website: '',
      }),
    ).toEqual({
      name: 'Alice',
      email: 'alice@example.com',
      message: 'Hello',
      website: '',
    });

    expect(
      parseContactRequest({
        name: 'Alice',
        email: 'alice@example.com',
        message: 'Hello',
        website: 'http://bot.example',
      }),
    ).toEqual({
      name: 'Alice',
      email: 'alice@example.com',
      message: 'Hello',
      website: 'http://bot.example',
    });
  });

  it('omits an undefined honeypot', () => {
    expect(
      parseContactRequest({
        name: 'Alice',
        email: 'alice@example.com',
        message: 'Hello',
        website: undefined,
      }),
    ).toEqual({
      name: 'Alice',
      email: 'alice@example.com',
      message: 'Hello',
    });
  });

  it('accepts 2000 code points and rejects 2001', () => {
    const message = '😀'.repeat(2000);

    expect(parseContactRequest({ name: 'Alice', email: 'alice@example.com', message })).toEqual({
      name: 'Alice',
      email: 'alice@example.com',
      message,
    });

    expect(
      parseContactRequest({
        name: 'Alice',
        email: 'alice@example.com',
        message: '😀'.repeat(2001),
      }),
    ).toBeNull();
  });

  it.each([
    {},
    { name: 'Alice', email: 'alice@example.com' },
    { name: 'Alice', message: 'Hello' },
    { email: 'alice@example.com', message: 'Hello' },
    { name: 'Alice', email: 'not-an-email', message: 'Hello' },
    { name: 'Alice', email: 'ali\u0000ce@example.com', message: 'Hello' },
    { name: '   ', email: 'alice@example.com', message: 'Hello' },
    { name: 'A'.repeat(101), email: 'alice@example.com', message: 'Hello' },
    { name: 'Ali\nce', email: 'alice@example.com', message: 'Hello' },
    { name: 'Alice', email: 'alice@example.com', message: '' },
    { name: 'Alice', email: 'alice@example.com', message: '   ' },
    { name: 'Alice', email: 'alice@example.com', message: 'a'.repeat(2001) },
    { name: 'Alice', email: 'alice@example.com', message: 'Hel\u0000lo' },
    {
      name: 'Alice',
      email: 'alice@example.com',
      message: 'Hello',
      to: 'attacker@example.com',
    },
    {
      name: 'Alice',
      email: 'alice@example.com',
      message: 'Hello',
      website: 123,
    },
    {
      name: 'Alice',
      email: 'alice@example.com',
      message: 'Hello',
      website: 'x'.repeat(201),
    },
    null,
  ])('rejects invalid contact request %#', (input) => {
    expect(parseContactRequest(input)).toBeNull();
  });
});
