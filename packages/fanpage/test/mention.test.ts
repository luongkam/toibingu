import { test } from "node:test";
import assert from "node:assert/strict";
import { DISCLOSURE } from "../src/compose.ts";
import { MENTION_CONFIG, decideMention, newMentionState, type MentionEvent } from "../src/mention.ts";
import type { PostBinding } from "../src/types.ts";

const M = "https://m.me/toibingu";
const story: PostBinding = { postId: "x", storyId: "st1", dossierUrl: "https://toibingu.vn/vu/et-o-et", quickTake: "Câu nói bị dùng ngược nghĩa.", published: true };
const ev = (over: Partial<MentionEvent> = {}): MentionEvent => ({ commentId: "c1", postId: "other_page_post", message: "@Tôi bị ngu vụ này là gì", createdAt: "2026-10-16T03:00:00Z", ...over });

test("until a pilot confirms Meta allows it, tags are counted, never answered", () => {
  const s = newMentionState();
  assert.deepEqual(decideMention(ev(), story, "unknown", s, M), { action: "count_only", reason: "capability_unknown", storyId: "st1" });
  assert.deepEqual(decideMention(ev({ commentId: "c2" }), story, "denied", s, M), { action: "count_only", reason: "capability_denied", storyId: "st1" });
  assert.equal(s.demand.get("st1"), 2);
});

test("confirmed capability: a matched story gets the quick take, an unmatched one a Messenger opt-in", () => {
  const hit = decideMention(ev(), story, "confirmed", newMentionState(), M);
  assert.equal(hit.action, "reply");
  if (hit.action === "reply") {
    assert.match(hit.text, /Câu nói bị dùng ngược nghĩa\./);
    assert.match(hit.text, /\?ref=fbtag-st1/);
  }
  const s = newMentionState();
  const miss = decideMention(ev({ commentId: "c7" }), undefined, "confirmed", s, M);
  assert.equal(miss.action, "reply");
  if (miss.action === "reply") {
    assert.match(miss.text, /m\.me\/toibingu/);
    assert.ok(miss.text.endsWith(DISCLOSURE));
  }
  assert.equal(s.demand.get("post:other_page_post"), 1, "unmatched demand is kept per post for editors");
});

test("unpublished dossiers are never quoted", () => {
  const d = decideMention(ev(), { ...story, published: false }, "confirmed", newMentionState(), M);
  assert.equal(d.action, "reply");
  if (d.action === "reply") assert.doesNotMatch(d.text, /Câu nói bị dùng ngược nghĩa/);
});

test("dedupe per comment, no comment id means count only, hourly cap", () => {
  const s = newMentionState();
  assert.equal(decideMention(ev(), story, "confirmed", s, M).action, "reply");
  assert.equal((decideMention(ev(), story, "confirmed", s, M) as { reason: string }).reason, "already_answered");
  const noId = ev();
  delete (noId as { commentId?: string }).commentId;
  assert.equal((decideMention(noId, story, "confirmed", s, M) as { reason: string }).reason, "no_comment_id");
  const capped = newMentionState();
  for (let i = 0; i < MENTION_CONFIG.maxRepliesPerHour; i++) decideMention(ev({ commentId: `k${i}` }), story, "confirmed", capped, M);
  assert.equal((decideMention(ev({ commentId: "last" }), story, "confirmed", capped, M) as { reason: string }).reason, "rate_limited");
});
