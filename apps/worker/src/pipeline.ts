/**
 * One scout cycle (REQ-009 layer 2, REQ-017): pull permitted sources, keep context requests,
 * propose unknown asked-about terms. Pure apart from the injected fetch; writes nothing.
 */
import type { Community } from "@toibingu/domain";
import {
  fetchGoogleTrends,
  searchInstagramHashtag,
  searchThreads,
  type AdapterResult,
  type FetchLike,
  type InstagramConfig,
  type IngestItem,
  type ThreadsConfig,
} from "@toibingu/ingest";
import { discoverCandidates, findTerms, type Candidate, type Term } from "@toibingu/lexicon";
import { detectContextRequest } from "@toibingu/signals";

/** Threads queries per cycle: the brief's context-request phrases (REQ-009). */
export const CONTEXT_QUERIES = ["vụ gì vậy", "là gì vậy", "ai tóm tắt giúp", "tôi bị ngu", "thông não giúp", "sao ai cũng nói"] as const;

export interface CycleConfig {
  threads: ThreadsConfig;
  instagram: InstagramConfig;
  lexicon: readonly Term[];
  /** Hashtags to spend the Instagram budget on (hottest lexicon terms first). */
  hashtags: readonly string[];
  community: Community;
  now?: Date;
}

export interface CycleReport {
  sources: { adapter: string; status: AdapterResult["status"]; items: number; warnings: string[] }[];
  contextRequests: number;
  knownTermHits: Record<string, number>;
  candidates: Candidate[];
}

const askerOf = (i: IngestItem): string => `${i.platform}:${i.author ?? i.externalId}`;

export async function runCycle(fetch: FetchLike, cfg: CycleConfig): Promise<CycleReport> {
  const now = cfg.now ?? new Date();
  const results: AdapterResult[] = [await fetchGoogleTrends(fetch, { now })];
  for (const q of CONTEXT_QUERIES) results.push(await searchThreads(fetch, cfg.threads, { q, searchType: "RECENT" }, now));
  for (const h of cfg.hashtags) results.push(await searchInstagramHashtag(fetch, cfg.instagram, h, now));

  const items = results.flatMap((r) => r.items);
  const asks = items.filter((i) => detectContextRequest(i.text).isRequest);
  const knownTermHits: Record<string, number> = {};
  for (const i of items) for (const id of findTerms(i.text, cfg.lexicon)) knownTermHits[id] = (knownTermHits[id] ?? 0) + 1;

  const merged = new Map<string, CycleReport["sources"][number]>();
  for (const r of results) {
    const m = merged.get(r.adapter) ?? { adapter: r.adapter, status: r.status, items: 0, warnings: [] };
    m.items += r.items.length;
    m.warnings.push(...r.warnings);
    if (r.status !== "ok") m.status = r.status;
    merged.set(r.adapter, m);
  }
  return {
    sources: [...merged.values()].map((s) => ({ ...s, warnings: [...new Set(s.warnings)] })),
    contextRequests: asks.length,
    knownTermHits,
    candidates: discoverCandidates(
      asks.map((i) => ({ text: i.text, community: cfg.community, askerId: askerOf(i) })),
      cfg.lexicon,
    ),
  };
}
