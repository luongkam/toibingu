import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanHashtag, searchInstagramHashtag } from "../src/adapters/instagram-hashtag.ts";
import { UniqueKeyQuota, instagramHashtagQuota } from "../src/quota.ts";
import { fakeFetch, json } from "./fake-fetch.ts";

const NOW = new Date("2026-10-16T03:00:00Z");
const cfg = (quota = instagramHashtagQuota()) => ({ accessToken: "t", igUserId: "17841", quota, graphVersion: "v23.0" });

test("two-step hashtag search maps recent media", async () => {
  const f = fakeFetch(json(200, { data: [{ id: "h1" }] }), json(200, { data: [{ id: "m1", caption: "tối cổ quá", permalink: "https://www.instagram.com/p/m1/", timestamp: "2026-10-16T01:00:00+0000" }] }));
  const r = await searchInstagramHashtag(f, cfg(), "#TốiCổ", NOW);
  assert.equal(r.status, "ok");
  assert.match(f.calls[0]!.url, /\/v23\.0\/ig_hashtag_search\?q=t%E1%BB%91ic%E1%BB%95&user_id=17841/);
  assert.match(f.calls[1]!.url, /\/v23\.0\/h1\/recent_media\?fields=id,caption,permalink,timestamp/);
  assert.equal(r.items[0]!.platform, "instagram");
  assert.equal(r.items[0]!.meta?.hashtag, "tốicổ");
});

test("30 unique hashtags per 7 days; repeating a hashtag is free", () => {
  const q = new UniqueKeyQuota(2, 7 * 86400000);
  const t = NOW.getTime();
  assert.equal(q.take("a", t), true);
  assert.equal(q.take("a", t), true);
  assert.equal(q.take("b", t), true);
  assert.equal(q.take("c", t), false);
  assert.equal(q.take("c", t + 7 * 86400000), true, "window rolls");
});

test("budget exhausted means no request; missing config means not_configured", async () => {
  const quota = new UniqueKeyQuota(0, 1);
  const f = fakeFetch();
  assert.equal((await searchInstagramHashtag(f, cfg(quota), "abc", NOW)).status, "quota_exhausted");
  assert.equal((await searchInstagramHashtag(f, { quota, graphVersion: "v23.0" }, "abc", NOW)).status, "not_configured");
  assert.equal(f.calls.length, 0);
});

test("permission errors are reported", async () => {
  const r = await searchInstagramHashtag(fakeFetch(json(403, { error: { code: 200, message: "needs Instagram Public Content Access" } })), cfg(), "abc", NOW);
  assert.equal(r.status, "permission_missing");
});

test("cleanHashtag", () => {
  assert.equal(cleanHashtag("#Hội Tối Cổ"), "hộitốicổ");
});
