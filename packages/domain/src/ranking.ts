/**
 * Ưu tiên = đang nóng + có nhu cầu hiểu bối cảnh + liên quan tới người xem.
 *
 * Credibility is NOT an input here: it is a publish gate (publish-gate.ts, ADR-0004),
 * so high engagement can never outweigh missing sources.
 *
 * Weights and caps are pilot hypotheses, tuned against docs/metrics/pilot-metrics.md.
 */
import type { Community } from "./story.ts";

export interface SourceGrowth {
  sourceId: string;
  community: Community;
  /** Discussion volume now ÷ this source's own baseline. Never raw cross-platform counts. */
  growthRatio: number;
}

export interface RankingInput {
  growth: SourceGrowth[];
  /** 0..1 from packages/signals: independent "vụ gì vậy?" requests, "chưa biết" taps, re-asks. */
  contextNeed: number;
  /** 0..1: how likely this reader meets or wants this story (outside feed, not outside interest). */
  relevance: number;
}

export const RANKING_CONFIG = {
  /** Growth at which a source is considered fully hot (8× its baseline). */
  maxGrowth: 8,
  /** Communities needed for full breadth credit. */
  breadthTarget: 3,
  /** Minimum per-community heat to count toward breadth. */
  breadthThreshold: 0.2,
  weights: { heat: 0.4, contextNeed: 0.4, relevance: 0.2 },
} as const;

const clamp01 = (n: number): number => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0);

/** Per-source heat on a log scale relative to its own baseline. */
export function sourceHeat(growthRatio: number, maxGrowth: number = RANKING_CONFIG.maxGrowth): number {
  if (!(growthRatio > 1)) return 0;
  return clamp01(Math.log2(growthRatio) / Math.log2(maxGrowth));
}

/**
 * Heat across sources. Within a community only the hottest source counts, so one big
 * channel or a wave of reposts cannot take over; spread across communities adds credit.
 */
export function heat(growth: SourceGrowth[]): number {
  const perCommunity = new Map<Community, number>();
  for (const g of growth) {
    const h = sourceHeat(g.growthRatio);
    perCommunity.set(g.community, Math.max(perCommunity.get(g.community) ?? 0, h));
  }
  if (perCommunity.size === 0) return 0;
  const values = [...perCommunity.values()];
  const peak = Math.max(...values);
  const breadth = values.filter((v) => v >= RANKING_CONFIG.breadthThreshold).length;
  return clamp01(0.7 * peak + 0.3 * Math.min(1, breadth / RANKING_CONFIG.breadthTarget));
}

export function priority(input: RankingInput): number {
  const w = RANKING_CONFIG.weights;
  return clamp01(
    w.heat * heat(input.growth) + w.contextNeed * clamp01(input.contextNeed) + w.relevance * clamp01(input.relevance),
  );
}
