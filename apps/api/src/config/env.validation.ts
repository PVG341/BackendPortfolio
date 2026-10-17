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

  return {
    ...environment,
    NODE_ENV: nodeEnv,
    PORT: port,
    CORS_ORIGIN: corsOrigin,
    REDIS_URL: redisUrl,
  };
}
