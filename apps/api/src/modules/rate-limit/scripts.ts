export const fixedWindowScript = `
local session = redis.call('GET', KEYS[1])

if not session then
  return {-1}
end

local config = cjson.decode(session)
local limit = tonumber(config.limit)
local windowMs = tonumber(config.windowSeconds) * 1000

local redisTime = redis.call('TIME')
local now = tonumber(redisTime[1]) * 1000 + math.floor(tonumber(redisTime[2]) / 1000)

local bucket = math.floor(now / windowMs)
local resetAt = (bucket + 1) * windowMs
local ttl = resetAt - now

if ttl < 1 then
  ttl = 1
end

local storedBucket = redis.call('HGET', KEYS[2], 'bucket')

if storedBucket ~= tostring(bucket) then
  redis.call('HSET', KEYS[2], 'bucket', tostring(bucket), 'count', '0')
end

local count = tonumber(redis.call('HGET', KEYS[2], 'count') or '0')

if count >= limit then
  redis.call('PEXPIRE', KEYS[2], ttl)

  return {0, limit, 0, resetAt, resetAt - now}
end

count = count + 1

redis.call('HSET', KEYS[2], 'count', tostring(count))
redis.call('PEXPIRE', KEYS[2], ttl)

return {1, limit, limit - count, resetAt, 0}
`;

export const slidingWindowScript = `
local session = redis.call('GET', KEYS[1])

if not session then
  return {-1}
end

local config = cjson.decode(session)
local limit = tonumber(config.limit)
local windowMs = tonumber(config.windowSeconds) * 1000

local redisTime = redis.call('TIME')
local now = tonumber(redisTime[1]) * 1000 + math.floor(tonumber(redisTime[2]) / 1000)
local cutoff = now - windowMs

redis.call('ZREMRANGEBYSCORE', KEYS[2], 0, cutoff)

local count = redis.call('ZCARD', KEYS[2])

if count >= limit then
  local oldest = redis.call('ZRANGE', KEYS[2], 0, 0, 'WITHSCORES')
  local resetAt = tonumber(oldest[2]) + windowMs
  local retryAfterMs = resetAt - now

  if retryAfterMs < 0 then
    retryAfterMs = 0
  end

  return {0, limit, 0, resetAt, retryAfterMs}
end

redis.call('ZADD', KEYS[2], now, ARGV[1])
redis.call('PEXPIRE', KEYS[2], windowMs)

local oldest = redis.call('ZRANGE', KEYS[2], 0, 0, 'WITHSCORES')
local resetAt = tonumber(oldest[2]) + windowMs

return {1, limit, limit - count - 1, resetAt, 0}
`;

export const abuseProtectionScript = `
local windowMs = tonumber(ARGV[1])
local ipLimit = tonumber(ARGV[2])
local serviceLimit = tonumber(ARGV[3])

local redisTime = redis.call('TIME')
local now = tonumber(redisTime[1]) * 1000 + math.floor(tonumber(redisTime[2]) / 1000)

local bucket = math.floor(now / windowMs)
local resetAt = (bucket + 1) * windowMs
local ttl = resetAt - now

if ttl < 1 then
  ttl = 1
end

local function readCount(key)
  local storedBucket = redis.call('HGET', key, 'bucket')

  if storedBucket ~= tostring(bucket) then
    return 0
  end

  return tonumber(redis.call('HGET', key, 'count') or '0')
end

local ipCount = readCount(KEYS[1])
local serviceCount = readCount(KEYS[2])

if ipCount >= ipLimit or serviceCount >= serviceLimit then
  return {0, resetAt - now}
end

redis.call('HSET', KEYS[1], 'bucket', tostring(bucket), 'count', tostring(ipCount + 1))
redis.call('PEXPIRE', KEYS[1], ttl)

redis.call(
  'HSET',
  KEYS[2],
  'bucket',
  tostring(bucket),
  'count',
  tostring(serviceCount + 1)
)
redis.call('PEXPIRE', KEYS[2], ttl)

return {1, 0}
`;
