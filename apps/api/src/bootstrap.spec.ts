import { describe, expect, it } from 'vitest';
import { BODY_LIMIT_BYTES, getTrustProxyHops } from './bootstrap.js';

describe('getTrustProxyHops', () => {
  it('defaults to 0', () => {
    expect(getTrustProxyHops({})).toBe(0);
  });

  it('accepts a valid hop count', () => {
    expect(getTrustProxyHops({ TRUST_PROXY_HOPS: '2' })).toBe(2);
  });

  it.each(['abc', '-1', '1.5', '11'])('rejects invalid value %s', (value) => {
    expect(() => getTrustProxyHops({ TRUST_PROXY_HOPS: value })).toThrow();
  });
});

describe('BODY_LIMIT_BYTES', () => {
  it('allows the contact payload size', () => {
    expect(BODY_LIMIT_BYTES).toBe(16 * 1024);
  });
});
