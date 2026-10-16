/**
 * A lexicon term: slang, catchphrase, nickname, hashtag or Toibingu brand keyword (RD-TBT001 REQ-017).
 * Heat (`TrendState`) is computed; review is a human gate. They never merge: a hot term that no editor
 * approved is never shown publicly, the same rule as stories (SD-TBH001 H-05).
 */
import type { Community, Platform } from "@toibingu/domain";

export type TermKind = "slang" | "catchphrase" | "nickname" | "hashtag" | "brand";

/** Computed from signals, never set by hand (except `evergreen`, an editor flag on the term). */
export type TrendState = "emerging" | "hot" | "fading" | "dormant";

export type ReviewState = "pending" | "approved" | "rejected";

export interface TermSource {
  url: string;
  platform: Platform;
  retrievedAt: string;
  accessMethod: "official_api" | "user_submitted" | "editor_added";
}

export interface Term {
  /** Stable slug, ASCII: `toi-co`. */
  id: string;
  /** Canonical written form with diacritics: "tối cổ". */
  display: string;
  /**
   * Other spellings people use. Matching uses the folded form (no diacritics, teen code expanded)
   * unless `accentedOnly` is set because the folded form collides with ordinary words.
   */
  variants: string[];
  accentedOnly?: boolean;
  kind: TermKind;
  /** Neutral meaning, ≤ 200 chars. */
  meaning: string;
  communities: Community[];
  platforms: Platform[];
  firstSeenAt: string;
  lastSeenAt?: string;
  evergreen?: boolean;
  /** Offensive or targeting terms: explained neutrally, never featured (SD-TBP001 P-08). */
  sensitive?: boolean;
  review: ReviewState;
  approvedBy: string | null;
  sources: TermSource[];
  storyIds?: string[];
}
