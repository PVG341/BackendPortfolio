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
  RESEND_API_KEY: 're_test_valid_api_key',
  CONTACT_TO_EMAIL: 'contact@example.com',
  CONTACT_FROM_EMAIL: 'onboarding@resend.dev',
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

  it('rejects missing RESEND_API_KEY', () => {
    const environment = {
      ...baseEnvironment,
      RESEND_API_KEY: undefined,
    };

    expect(() => validateEnvironment(environment)).toThrow(
      'RESEND_API_KEY must be a non-empty string',
    );
  });

  it('rejects RESEND_API_KEY shorter than 8 characters', () => {
    const environment = {
      ...baseEnvironment,
      RESEND_API_KEY: 'short',
    };

    expect(() => validateEnvironment(environment)).toThrow(
      'RESEND_API_KEY must be at least 8 characters',
    );
  });

  it('rejects invalid CONTACT_TO_EMAIL', () => {
    const environment = {
      ...baseEnvironment,
      CONTACT_TO_EMAIL: 'invalid-email',
    };

    expect(() => validateEnvironment(environment)).toThrow(
      'CONTACT_TO_EMAIL must be a valid email address',
    );
  });

  it('rejects invalid CONTACT_FROM_EMAIL', () => {
    const environment = {
      ...baseEnvironment,
      CONTACT_FROM_EMAIL: 'invalid-email',
    };

    expect(() => validateEnvironment(environment)).toThrow(
      'CONTACT_FROM_EMAIL must be a valid email address',
    );
  });

  it('defaults CONTACT_FROM_EMAIL to onboarding@resend.dev', () => {
    const environment = {
      ...baseEnvironment,
      CONTACT_FROM_EMAIL: undefined,
    };

    const result = validateEnvironment(environment);

    expect(result.CONTACT_FROM_EMAIL).toBe('onboarding@resend.dev');
  });
});
