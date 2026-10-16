/**
 * New-term candidates from what people ask about ("X là gì"), for the Studio review queue.
 * Only proposes; an editor approves (SD-TBH001 H-16).
 */
import { extractAskedTerms } from "@toibingu/signals";
import type { Community } from "@toibingu/domain";
import { findTerms, slugify } from "./match.ts";
import type { Term } from "./term.ts";

export interface AskedText {
  text: string;
  community: Community;
  /** Hashed device or author id; independence is counted on this, never on raw message count. */
  askerId: string;
}

export interface Candidate {
  id: string;
  display: string;
  independentAskers: number;
  communities: Community[];
}

export const DISCOVERY_CONFIG = { minAskers: 5, minAskersCrossCommunity: 3 } as const;

export function discoverCandidates(asked: readonly AskedText[], lexicon: readonly Term[]): Candidate[] {
  const byId = new Map<string, { display: string; askers: Set<string>; communities: Set<Community> }>();
  for (const a of asked) {
    for (const term of extractAskedTerms(a.text)) {
      if (findTerms(term, lexicon).length > 0) continue; // already known (any review state)
      const id = slugify(term);
      if (!id) continue;
      const e = byId.get(id) ?? { display: term, askers: new Set(), communities: new Set() };
      e.askers.add(a.askerId);
      e.communities.add(a.community);
      byId.set(id, e);
    }
  }
  return [...byId.entries()]
    .map(([id, e]) => ({ id, display: e.display, independentAskers: e.askers.size, communities: [...e.communities] }))
    .filter(
      (c) =>
        c.independentAskers >= DISCOVERY_CONFIG.minAskers ||
        (c.communities.length >= 2 && c.independentAskers >= DISCOVERY_CONFIG.minAskersCrossCommunity),
    )
    .sort((a, b) => b.communities.length - a.communities.length || b.independentAskers - a.independentAskers);
}
