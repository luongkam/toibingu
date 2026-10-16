import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fetchGoogleTrends, parseTraffic } from "../src/adapters/google-trends.ts";
import { fakeFetch } from "./fake-fetch.ts";

const XML = readFileSync(join(import.meta.dirname, "fixtures/google-trends-vn.xml"), "utf8");
const NOW = new Date("2026-10-16T03:00:00Z");

test("parses the real 2026 VN feed shape into official public sources", async () => {
  const f = fakeFetch({ status: 200, body: XML });
  const r = await fetchGoogleTrends(f, { now: NOW });
  assert.equal(r.status, "ok");
  assert.equal(f.calls[0]!.url, "https://trends.google.com/trending/rss?geo=VN");
  assert.deepEqual(r.items.map((i) => i.meta?.query), ["doanh thu", "giá vàng hôm nay"]);
  const first = r.items[0]!;
  assert.equal(first.meta?.approxTraffic, 500);
  assert.equal(first.meta?.newsCount, 3);
  assert.match(first.url, /^https:\/\/www\.24h\.com\.vn\//);
  assert.equal(first.publishedAt, "2026-10-16T02:10:00.000Z");
  assert.equal(first.source.accessMethod, "official_api");
  assert.equal(first.source.visibility, "public");
});

test("a moved or broken feed degrades instead of throwing", async () => {
  assert.equal((await fetchGoogleTrends(fakeFetch({ status: 404, body: "" }), { now: NOW })).status, "degraded");
  assert.equal((await fetchGoogleTrends(fakeFetch({ status: 200, body: "<rss></rss>" }), { now: NOW })).status, "degraded");
  assert.equal((await fetchGoogleTrends(fakeFetch(new Error("ECONNRESET")), { now: NOW })).status, "degraded");
});

test("traffic labels", () => {
  assert.equal(parseTraffic("500+"), 500);
  assert.equal(parseTraffic("2K+"), 2000);
  assert.equal(parseTraffic("1M+"), 1_000_000);
  assert.equal(parseTraffic(undefined), 0);
});
