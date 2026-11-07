import { describe, expect, it } from 'vitest';
import { validateEnvironment } from './env.validation.js';

const baseEnvironment = {
  NODE_ENV: 'test',
  PORT: '3001',
  CORS_ORIGIN: 'http://localhost:3000',
  REDIS_URL: 'redis://127.0.0.1:6379',
  TRUST_PROXY_HOPS: '0',
  ABUSE_KEY_NAMESPACE: 'portfolio-test',
  ABUSE_KEY_SECRET: 'x'.repeat(32),
  DEMO_DATABASE_URL: 'postgresql://portfolio_demo_reader:test@127.0.0.1:5433/portfolio_demo',
};

describe('validateEnvironment', () => {
  it('accepts a valid demo database URL', () => {
    expect(validateEnvironment(baseEnvironment).DEMO_DATABASE_URL).toBe(
      baseEnvironment.DEMO_DATABASE_URL,
    );
  });

  it.each([
    { ...baseEnvironment, DEMO_DATABASE_URL: undefined },
    { ...baseEnvironment, DEMO_DATABASE_URL: 'mysql://host/db' },
    { ...baseEnvironment, DEMO_DATABASE_URL: 'postgresql:///portfolio_demo' },
    { ...baseEnvironment, DEMO_DATABASE_URL: 'postgresql://host' },
  ])('rejects invalid demo database URL %#', (environment) => {
    expect(() => validateEnvironment(environment)).toThrow();
  });
});
