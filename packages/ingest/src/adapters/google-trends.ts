/**
 * Google Trends daily trending searches RSS (SD-TBI001 IF-02). Public feed, no credentials.
 * URL moved in 2026: the old /trends/trendingsearches/daily/rss returns 404.
 */
import type { FetchLike, AdapterResult, IngestItem } from "../types.ts";
import { officialSource, result } from "../types.ts";

export const GOOGLE_TRENDS_RSS = "https://trends.google.com/trending/rss";

const decode = (s: string): string =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n: string) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .trim();

const tag = (xml: string, name: string): string | undefined => {
  const m = new RegExp(`<${name}>([\\s\\S]*?)</${name}>`).exec(xml);
  return m ? decode(m[1]!) : undefined;
};

/** "500+" → 500, "2K+" → 2000, "1M+" → 1000000; unknown → 0. */
export function parseTraffic(s: string | undefined): number {
  const m = /^([\d.,]+)\s*([KM])?\+?$/i.exec((s ?? "").trim());
  if (!m) return 0;
  const n = Number(m[1]!.replace(/,/g, ""));
  return Math.round(n * (m[2]?.toUpperCase() === "M" ? 1e6 : m[2]?.toUpperCase() === "K" ? 1e3 : 1));
}

export function parseTrendsRss(xml: string, retrievedAt: string): IngestItem[] {
  const items: IngestItem[] = [];
  for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const body = m[1]!;
    const title = tag(body, "title");
    if (!title) continue;
    const news = [...body.matchAll(/<ht:news_item>([\s\S]*?)<\/ht:news_item>/g)].map((n) => ({
      title: tag(n[1]!, "ht:news_item_title") ?? "",
      url: tag(n[1]!, "ht:news_item_url") ?? "",
      source: tag(n[1]!, "ht:news_item_source") ?? "",
    }));
    const pub = tag(body, "pubDate");
    const url = news.find((n) => n.url.startsWith("https://"))?.url ?? `https://trends.google.com/trends/explore?geo=VN&q=${encodeURIComponent(title)}`;
    const externalId = `${title}|${pub ?? ""}`;
    items.push({
      externalId,
      text: [title, ...news.map((n) => n.title)].filter(Boolean).join(" · "),
      url,
      platform: "web",
      ...(pub ? { publishedAt: new Date(pub).toISOString() } : {}),
      source: officialSource("web", `gtrends:${externalId}`, url, retrievedAt),
      meta: { query: title, approxTraffic: parseTraffic(tag(body, "ht:approx_traffic")), newsCount: news.length },
    });
  }
  return items;
}

export async function fetchGoogleTrends(fetch: FetchLike, opts: { geo?: string; now?: Date } = {}): Promise<AdapterResult> {
  const name = "google-trends";
  const now = (opts.now ?? new Date()).toISOString();
  try {
    const res = await fetch(`${GOOGLE_TRENDS_RSS}?geo=${encodeURIComponent(opts.geo ?? "VN")}`);
    if (res.status !== 200) return result(name, "degraded", [], [`HTTP ${res.status}`]);
    const items = parseTrendsRss(await res.text(), now);
    return items.length ? result(name, "ok", items) : result(name, "degraded", [], ["feed parsed but no items: format may have changed"]);
  } catch (e) {
    return result(name, "degraded", [], [`network: ${(e as Error).message}`]);
  }
}
