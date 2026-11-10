import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

let ratelimiter: Ratelimit | null = null;

export function getRateLimiter(redisUrl: string, redisToken: string): Ratelimit {
  if (!ratelimiter) {
    const redis = new Redis({
      url: redisUrl,
      token: redisToken,
    });

    ratelimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '1 h'),
      prefix: 'contact-form',
    });
  }

  return ratelimiter;
}

export async function checkRateLimit(
  clientIp: string,
  redisUrl: string,
  redisToken: string
): Promise<{ allowed: boolean }> {
  const limiter = getRateLimiter(redisUrl, redisToken);
  const result = await limiter.limit(clientIp);
  return { allowed: result.success };
}

export function resetRateLimiter(): void {
  ratelimiter = null;
}
