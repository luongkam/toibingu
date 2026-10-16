import { test } from "node:test";
import assert from "node:assert/strict";
import { instagramHashtagQuota, threadsKeywordQuota, type FetchLike } from "@toibingu/ingest";
import type { Term } from "@toibingu/lexicon";
import { runCycle } from "../src/pipeline.ts";

const RSS = `<rss><channel><item><title>doanh thu</title><ht:approx_traffic>500+</ht:approx_traffic><pubDate>Thu, 15 Oct 2026 19:10:00 -0700</pubDate></item></channel></rss>`;
const lexicon: Term[] = [
  { id: "toi-co", display: "tối cổ", variants: [], accentedOnly: true, kind: "slang", meaning: "m", communities: ["meme"], platforms: ["threads"], firstSeenAt: "2026-10-16", review: "pending", approvedBy: null, sources: [] },
];

/** Routes by URL: RSS for Google, a fixed page of Threads posts for every keyword query. */
function router(threadsPosts: unknown[]): FetchLike {
  return async (url) => {
    if (url.startsWith("https://trends.google.com/")) return { status: 200, text: async () => RSS };
    if (url.startsWith("https://graph.threads.net/")) return { status: 200, text: async () => JSON.stringify({ data: threadsPosts }) };
    throw new Error(`unexpected ${url}`);
  };
}

const cfg = (token?: string) => ({
  threads: { quota: threadsKeywordQuota(), ...(token ? { accessToken: token } : {}) },
  instagram: { quota: instagramHashtagQuota(), graphVersion: "v23.0" },
  lexicon,
  hashtags: ["toico"],
  community: "meme" as const,
  now: new Date("2026-10-16T03:00:00Z"),
});

test("without credentials the cycle still runs on Google Trends and reports the rest", async () => {
  const r = await runCycle(router([]), cfg());
  const by = Object.fromEntries(r.sources.map((s) => [s.adapter, s.status]));
  assert.deepEqual(by, { "google-trends": "ok", threads: "not_configured", "instagram-hashtag": "not_configured" });
  assert.deepEqual(r.candidates, []);
});

test("independent askers on Threads turn an unknown term into a candidate; known terms are counted", async () => {
  const posts = Array.from({ length: 5 }, (_, i) => ({
    id: `p${i}`,
    text: i === 0 ? "đúng là tối cổ, 'ét o ét' là gì vậy" : "'ét o ét' là gì vậy",
    permalink: `https://www.threads.com/@u${i}/post/p${i}`,
    username: `u${i}`,
  }));
  const r = await runCycle(router(posts), cfg("tok"));
  assert.equal(r.candidates[0]?.id, "et-o-et");
  assert.equal(r.candidates[0]?.independentAskers, 5, "each author counted once across all queries");
  assert.ok((r.knownTermHits["toi-co"] ?? 0) >= 1);
  assert.equal(r.sources.find((s) => s.adapter === "threads")?.status, "ok");
});
