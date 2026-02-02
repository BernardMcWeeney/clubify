// Rate limiting utilities using Cloudflare KV
// Implements a sliding window rate limiter

interface RateLimitConfig {
  /** Maximum number of requests allowed */
  limit: number;
  /** Time window in seconds */
  windowSeconds: number;
}

interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Number of remaining requests in the current window */
  remaining: number;
  /** Unix timestamp when the limit resets */
  resetAt: number;
  /** Number of requests made in the current window */
  current: number;
}

/**
 * Default rate limit configurations for different endpoints
 */
export const RATE_LIMITS = {
  // Auth endpoints - more restrictive
  magicLink: { limit: 5, windowSeconds: 300 }, // 5 requests per 5 minutes
  authVerify: { limit: 10, windowSeconds: 60 }, // 10 requests per minute

  // Form submissions - moderate
  formSubmit: { limit: 10, windowSeconds: 60 }, // 10 per minute
  contactSubmit: { limit: 5, windowSeconds: 60 }, // 5 per minute

  // API endpoints - more generous
  apiRead: { limit: 100, windowSeconds: 60 }, // 100 per minute
  apiWrite: { limit: 30, windowSeconds: 60 }, // 30 per minute

  // Social publishing - restrictive to avoid API rate limits
  socialPublish: { limit: 10, windowSeconds: 300 }, // 10 per 5 minutes
} as const;

/**
 * Check and update rate limit for a given key
 *
 * @param kv - Cloudflare KV namespace
 * @param key - Unique identifier (e.g., IP address, user ID, or combination)
 * @param config - Rate limit configuration
 * @returns Rate limit result with allowed status and metadata
 */
export async function checkRateLimit(
  kv: KVNamespace | undefined,
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  // If KV is not available, allow all requests (development mode)
  if (!kv) {
    return {
      allowed: true,
      remaining: config.limit,
      resetAt: Date.now() + config.windowSeconds * 1000,
      current: 0,
    };
  }

  const now = Date.now();
  const windowStart = now - config.windowSeconds * 1000;
  const resetAt = now + config.windowSeconds * 1000;

  // Get current request timestamps
  const kvKey = `rate:${key}`;
  const stored = await kv.get(kvKey);
  let timestamps: number[] = stored ? JSON.parse(stored) : [];

  // Filter out timestamps outside the current window
  timestamps = timestamps.filter(ts => ts > windowStart);

  const current = timestamps.length;
  const allowed = current < config.limit;

  if (allowed) {
    // Add current request timestamp
    timestamps.push(now);

    // Store updated timestamps with TTL
    await kv.put(kvKey, JSON.stringify(timestamps), {
      expirationTtl: config.windowSeconds,
    });
  }

  return {
    allowed,
    remaining: Math.max(0, config.limit - current - (allowed ? 1 : 0)),
    resetAt,
    current: current + (allowed ? 1 : 0),
  };
}

/**
 * Create rate limit headers for response
 */
export function rateLimitHeaders(result: RateLimitResult, config: RateLimitConfig): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(config.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
  };
}

/**
 * Create a rate limit exceeded response
 */
export function rateLimitExceeded(result: RateLimitResult, config: RateLimitConfig): Response {
  return new Response(
    JSON.stringify({
      error: 'Too many requests',
      retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
        ...rateLimitHeaders(result, config),
      },
    }
  );
}

/**
 * Generate a rate limit key from request
 * Uses IP address combined with endpoint path
 */
export function getRateLimitKey(request: Request, endpoint: string): string {
  // Get client IP from Cloudflare headers
  const ip = request.headers.get('CF-Connecting-IP')
    || request.headers.get('X-Forwarded-For')?.split(',')[0].trim()
    || 'unknown';

  return `${endpoint}:${ip}`;
}

/**
 * Higher-order function to wrap an endpoint with rate limiting
 *
 * Usage:
 * export const POST = withRateLimit(
 *   RATE_LIMITS.magicLink,
 *   'magic-link',
 *   async ({ request, locals }) => { ... }
 * );
 */
export function withRateLimit<T extends { request: Request; locals: { runtime: { env: { RATE_LIMIT?: KVNamespace } } } }>(
  config: RateLimitConfig,
  endpoint: string,
  handler: (context: T) => Promise<Response>
) {
  return async (context: T): Promise<Response> => {
    const key = getRateLimitKey(context.request, endpoint);
    const kv = context.locals.runtime.env.RATE_LIMIT;

    const result = await checkRateLimit(kv, key, config);

    if (!result.allowed) {
      return rateLimitExceeded(result, config);
    }

    const response = await handler(context);

    // Add rate limit headers to successful responses
    const headers = new Headers(response.headers);
    Object.entries(rateLimitHeaders(result, config)).forEach(([k, v]) => {
      headers.set(k, v);
    });

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  };
}
