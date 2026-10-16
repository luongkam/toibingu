import { test } from "node:test";
import assert from "node:assert/strict";
import { searchThreads } from "../src/adapters/threads.ts";
import { RollingQuota, threadsKeywordQuota } from "../src/quota.ts";
import { fakeFetch, json } from "./fake-fetch.ts";

const NOW = new Date("2026-10-16T03:00:00Z");
const post = { id: "1", text: "vụ gì vậy mọi người", permalink: "https://www.threads.com/@a/post/1", timestamp: "2026-10-16T02:00:00+0000", username: "a" };

test("keyword search builds the documented request and maps public posts", async () => {
  const f = fakeFetch(json(200, { data: [post, { id: "2" }] }));
  const r = await searchThreads(f, { accessToken: "tok", quota: threadsKeywordQuota() }, { q: "vụ gì vậy", searchMode: "TAG", since: 1760500000 }, NOW);
  assert.equal(r.status, "ok");
  const u = new URL(f.calls[0]!.url);
  assert.equal(u.origin + u.pathname, "https://graph.threads.net/v1.0/keyword_search");
  assert.equal(u.searchParams.get("q"), "vụ gì vậy");
  assert.equal(u.searchParams.get("search_mode"), "TAG");
  assert.equal(u.searchParams.get("search_type"), "RECENT");
  assert.equal(u.searchParams.get("since"), "1760500000");
  assert.equal(r.items.length, 1, "posts without text or permalink are dropped");
  assert.equal(r.items[0]!.source.id, "threads:1");
  assert.equal(r.items[0]!.source.accessMethod, "official_api");
});

test("no token means not_configured and no request", async () => {
  const f = fakeFetch();
  assert.equal((await searchThreads(f, { quota: threadsKeywordQuota() }, { q: "x" }, NOW)).status, "not_configured");
  assert.equal(f.calls.length, 0);
});

test("missing permission and rate limits are reported, not thrown", async () => {
  const perm = await searchThreads(fakeFetch(json(400, { error: { code: 10, message: "permission" } })), { accessToken: "t", quota: threadsKeywordQuota() }, { q: "x" }, NOW);
  assert.equal(perm.status, "permission_missing");
  const rate = await searchThreads(fakeFetch(json(400, { error: { code: 613, message: "rate" } })), { accessToken: "t", quota: threadsKeywordQuota() }, { q: "x" }, NOW);
  assert.equal(rate.status, "quota_exhausted");
  const net = await searchThreads(fakeFetch(new Error("ETIMEDOUT")), { accessToken: "t", quota: threadsKeywordQuota() }, { q: "x" }, NOW);
  assert.equal(net.status, "degraded");
});

test("local quota stops requests; empty results are not counted", async () => {
  const quota = new RollingQuota(1, 24 * 3600 * 1000);
  await searchThreads(fakeFetch(json(200, { data: [] })), { accessToken: "t", quota }, { q: "x" }, NOW);
  assert.equal(quota.remaining(NOW.getTime()), 1, "empty search refunded");
  await searchThreads(fakeFetch(json(200, { data: [post] })), { accessToken: "t", quota }, { q: "x" }, NOW);
  const f = fakeFetch();
  assert.equal((await searchThreads(f, { accessToken: "t", quota }, { q: "x" }, NOW)).status, "quota_exhausted");
  assert.equal(f.calls.length, 0);
});
