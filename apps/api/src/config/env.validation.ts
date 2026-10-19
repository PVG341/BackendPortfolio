function readString(environment: Record<string, unknown>, key: string, fallback?: string): string {
  const value = environment[key];

  if (value === undefined && fallback !== undefined) {
    return fallback;
  }

  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${key} must be a non-empty string`);
  }

  return value;
}

function readInteger(
  environment: Record<string, unknown>,
  key: string,
  minimum: number,
  maximum: number,
  fallback: string,
): number {
  const value = readString(environment, key, fallback);

  if (!/^\d+$/.test(value)) {
    throw new Error(`${key} must be an integer`);
  }

  const parsed = Number(value);

  if (parsed < minimum || parsed > maximum) {
    throw new Error(`${key} must be between ${minimum} and ${maximum}`);
  }

  return parsed;
}

function readAbuseNamespace(environment: Record<string, unknown>): string {
  const namespace = readString(environment, 'ABUSE_KEY_NAMESPACE');

  if (!/^[a-z0-9][a-z0-9:_-]{0,63}$/i.test(namespace)) {
    throw new Error(
      'ABUSE_KEY_NAMESPACE must contain only letters, numbers, colon, underscore, or hyphen',
    );
  }

  return namespace;
}

export function validateEnvironment(environment: Record<string, unknown>): Record<string, unknown> {
  const nodeEnv = readString(environment, 'NODE_ENV', 'development');
  if (!['development', 'test', 'production'].includes(nodeEnv)) {
    throw new Error('NODE_ENV is invalid');
  }

  const rawPort = readString(environment, 'PORT', '3001');

  if (!/^\d+$/.test(rawPort)) {
    throw new Error('PORT must be an integer');
  }

  const port = Number(rawPort);
  if (port < 1 || port > 65535) {
    throw new Error('PORT must be between 1 and 65535');
  }

  const corsOrigin = readString(environment, 'CORS_ORIGIN', 'http://localhost:3000');

  let parsedOrigin: URL;
  try {
    parsedOrigin = new URL(corsOrigin);
  } catch {
    throw new Error('CORS_ORIGIN must be a valid URL');
  }
  if (!['http:', 'https:'].includes(parsedOrigin.protocol) || parsedOrigin.origin !== corsOrigin) {
    throw new Error('CORS_ORIGIN must be an exact HTTP or HTTPS origin');
  }

  const redisUrl = environment.REDIS_URL;
  if (typeof redisUrl !== 'string' || redisUrl.length === 0) {
    throw new Error('REDIS_URL is required');
  }

  let parsedRedisUrl: URL;
  try {
    parsedRedisUrl = new URL(redisUrl);
  } catch {
    throw new Error('REDIS_URL must be a valid URL');
  }
  if (!['redis:', 'rediss:'].includes(parsedRedisUrl.protocol) || !parsedRedisUrl.hostname) {
    throw new Error('REDIS_URL must use redis:// or rediss://');
  }

  const trustProxyHops = readInteger(environment, 'TRUST_PROXY_HOPS', 0, 10, '0');

  const abuseKeyNamespace = readAbuseNamespace(environment);

  const abuseKeySecret = readString(environment, 'ABUSE_KEY_SECRET');

  if (abuseKeySecret.length < 32) {
    throw new Error('ABUSE_KEY_SECRET must contain at least 32 characters');
  }

  return {
    ...environment,
    NODE_ENV: nodeEnv,
    PORT: port,
    CORS_ORIGIN: corsOrigin,
    REDIS_URL: redisUrl,
    TRUST_PROXY_HOPS: trustProxyHops,
    ABUSE_KEY_NAMESPACE: abuseKeyNamespace,
    ABUSE_KEY_SECRET: abuseKeySecret,
  };
}
