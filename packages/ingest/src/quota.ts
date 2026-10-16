/**
 * Rolling-window quotas kept on our side so we never hit a platform limit by accident.
 * Threads keyword search: 2,200 queries / user / 24h (empty results are not counted by Meta).
 * Instagram hashtag search: 30 unique hashtags / 7 days; repeating a hashtag inside the window is free.
 */
const DAY = 24 * 60 * 60 * 1000;

export class RollingQuota {
  readonly limit: number;
  readonly windowMs: number;
  private used: number[] = [];
  constructor(limit: number, windowMs: number) {
    this.limit = limit;
    this.windowMs = windowMs;
  }

  private prune(now: number): void {
    this.used = this.used.filter((t) => now - t < this.windowMs);
  }

  remaining(now: number): number {
    this.prune(now);
    return this.limit - this.used.length;
  }

  /** Takes one unit; false when the window is full. */
  take(now: number): boolean {
    if (this.remaining(now) <= 0) return false;
    this.used.push(now);
    return true;
  }

  /** Gives back the last unit taken (e.g. a query that returned nothing). */
  refund(): void {
    this.used.pop();
  }
}

export class UniqueKeyQuota {
  readonly limit: number;
  readonly windowMs: number;
  private seen = new Map<string, number>();
  constructor(limit: number, windowMs: number) {
    this.limit = limit;
    this.windowMs = windowMs;
  }

  take(key: string, now: number): boolean {
    for (const [k, t] of this.seen) if (now - t >= this.windowMs) this.seen.delete(k);
    if (this.seen.has(key)) return true;
    if (this.seen.size >= this.limit) return false;
    this.seen.set(key, now);
    return true;
  }
}

export const threadsKeywordQuota = (): RollingQuota => new RollingQuota(2200, DAY);
export const instagramHashtagQuota = (): UniqueKeyQuota => new UniqueKeyQuota(30, 7 * DAY);
