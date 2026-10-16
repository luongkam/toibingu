/**
 * Threads keyword / topic-tag search (SD-TBI001 IF-01). Needs Advanced Access to `threads_keyword_search`;
 * without it Meta only returns the token owner's own posts. Each editor uses their own token and quota (I-08).
 */
import { graphStatus } from "../graph-errors.ts";
import type { RollingQuota } from "../quota.ts";
import type { AdapterResult, FetchLike, IngestItem } from "../types.ts";
import { officialSource, result } from "../types.ts";

export const THREADS_API = "https://graph.threads.net/v1.0";
const FIELDS = "id,text,permalink,timestamp,username,media_type";

export interface ThreadsSearch {
  q: string;
  searchType?: "TOP" | "RECENT";
  searchMode?: "KEYWORD" | "TAG";
  /** Unix seconds. */
  since?: number;
}

export interface ThreadsConfig {
  accessToken?: string;
  quota: RollingQuota;
  baseUrl?: string;
}

export function threadsSearchUrl(base: string, s: ThreadsSearch, token: string): string {
  const p = new URLSearchParams({ q: s.q, search_type: s.searchType ?? "RECENT", fields: FIELDS, access_token: token });
  if (s.searchMode) p.set("search_mode", s.searchMode);
  if (s.since !== undefined) p.set("since", String(s.since));
  return `${base}/keyword_search?${p.toString()}`;
}

export async function searchThreads(fetch: FetchLike, cfg: ThreadsConfig, s: ThreadsSearch, now = new Date()): Promise<AdapterResult> {
  const name = "threads";
  if (!cfg.accessToken) return result(name, "not_configured", [], ["no Threads access token"]);
  if (!cfg.quota.take(now.getTime())) return result(name, "quota_exhausted", [], ["local 24h quota reached"]);
  try {
    const res = await fetch(threadsSearchUrl(cfg.baseUrl ?? THREADS_API, s, cfg.accessToken));
    const body = await res.text();
    const err = graphStatus(res.status, body);
    if (err) {
      cfg.quota.refund();
      return result(name, err.status, [], [err.message]);
    }
    const data = (JSON.parse(body) as { data?: { id: string; text?: string; permalink?: string; timestamp?: string; username?: string }[] }).data ?? [];
    if (data.length === 0) cfg.quota.refund(); // Meta does not count empty searches
    const at = now.toISOString();
    const items: IngestItem[] = data
      .filter((d) => d.text && d.permalink)
      .map((d) => ({
        externalId: d.id,
        text: d.text!,
        url: d.permalink!,
        platform: "threads",
        ...(d.username ? { author: d.username } : {}),
        ...(d.timestamp ? { publishedAt: new Date(d.timestamp).toISOString() } : {}),
        source: officialSource("threads", d.id, d.permalink!, at),
        meta: { query: s.q, mode: s.searchMode ?? "KEYWORD" },
      }));
    return result(name, "ok", items);
  } catch (e) {
    cfg.quota.refund();
    return result(name, "degraded", [], [`network: ${(e as Error).message}`]);
  }
}
