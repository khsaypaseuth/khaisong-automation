// Simple in-memory fixed-window rate limiter. Adequate for a single-instance
// admin app; swap for a Redis-backed limiter if you scale horizontally.

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
};

export class RateLimiter {
  private hits = new Map<string, { count: number; resetAt: number }>();

  constructor(
    private limit: number,
    private windowMs: number,
    private now: () => number = () => Date.now(),
  ) {}

  check(key: string): RateLimitResult {
    const t = this.now();
    const entry = this.hits.get(key);

    if (!entry || t >= entry.resetAt) {
      this.hits.set(key, { count: 1, resetAt: t + this.windowMs });
      return { allowed: true, remaining: this.limit - 1, retryAfterMs: 0 };
    }

    if (entry.count >= this.limit) {
      return { allowed: false, remaining: 0, retryAfterMs: entry.resetAt - t };
    }

    entry.count += 1;
    return {
      allowed: true,
      remaining: this.limit - entry.count,
      retryAfterMs: 0,
    };
  }

  /** Drops a key (e.g. after a successful login). */
  reset(key: string): void {
    this.hits.delete(key);
  }
}
