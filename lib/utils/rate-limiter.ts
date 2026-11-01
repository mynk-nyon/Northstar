/**
 * In-memory sliding window rate limiter for Next.js API routes.
 */

interface RateLimitRecord {
  timestamps: number[];
}

const ipRequestMap = new Map<string, RateLimitRecord>();

// Cleanup stale entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of ipRequestMap.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < 60000);
      if (record.timestamps.length === 0) {
        ipRequestMap.delete(ip);
      }
    }
  }, 300000);
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
}

/**
 * Checks if a request from the given client identifier is within rate limits.
 *
 * @param identifier - Client IP address or token
 * @param maxRequests - Maximum requests allowed per window (default 30)
 * @param windowSeconds - Window size in seconds (default 60)
 * @returns RateLimitResult
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number = 30,
  windowSeconds: number = 60
): RateLimitResult {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  let record = ipRequestMap.get(identifier);
  if (!record) {
    record = { timestamps: [] };
    ipRequestMap.set(identifier, record);
  }

  // Filter timestamps within current window
  record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (record.timestamps.length >= maxRequests) {
    const oldest = record.timestamps[0];
    const resetSeconds = Math.ceil((oldest + windowMs - now) / 1000);
    return {
      success: false,
      limit: maxRequests,
      remaining: 0,
      resetSeconds: Math.max(1, resetSeconds),
    };
  }

  record.timestamps.push(now);
  return {
    success: true,
    limit: maxRequests,
    remaining: maxRequests - record.timestamps.length,
    resetSeconds: windowSeconds,
  };
}

/**
 * Helper to extract client IP from Next.js request headers.
 */
export function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}
