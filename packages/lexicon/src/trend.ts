/**
 * Trend state of a term from its recent usage. Thresholds are pilot hypotheses (RD-TBT001 §9).
 */
import { sourceHeat } from "@toibingu/domain";
import type { TrendState } from "./term.ts";

export interface TermStats {
  /** Uses in the current window ÷ this term's own baseline (per source, already de-duplicated). */
  growthRatio: number;
  /** Distinct communities where the term appeared in the window. */
  communities: number;
  /** Days since the term was last seen in any tracked source. */
  daysSinceSeen: number;
}

export const TREND_CONFIG = {
  hotHeat: 0.6,
  hotHeatSingleCommunity: 0.85,
  emergingHeat: 0.2,
  dormantAfterDays: 14,
} as const;

export function trendState(s: TermStats, evergreen = false): TrendState {
  const h = sourceHeat(s.growthRatio);
  if (s.daysSinceSeen > TREND_CONFIG.dormantAfterDays) return evergreen ? "fading" : "dormant";
  if (h >= TREND_CONFIG.hotHeatSingleCommunity || (h >= TREND_CONFIG.hotHeat && s.communities >= 2)) return "hot";
  if (h >= TREND_CONFIG.emergingHeat) return "emerging";
  return "fading";
}

/** Public surfaces (decoder, SEO "X là gì", intake aliases shown to readers) only use approved terms. */
export function isPublic(t: { review: string; approvedBy: string | null }): boolean {
  return t.review === "approved" && t.approvedBy !== null;
}
