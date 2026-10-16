import { test } from "node:test";
import assert from "node:assert/strict";
import type { Term } from "@toibingu/lexicon";
import { DISCLOSURE, OPENERS, composeReply } from "../src/compose.ts";
import { REPLY_CONFIG, decideReply } from "../src/policy.ts";
import { newReplyState, type CommentEvent, type PostBinding } from "../src/types.ts";

const lexicon: Term[] = [
  { id: "toi-bi-ngu", display: "tôi bị ngu", variants: ["t bị ngu", "tui bị ngu"], kind: "catchphrase", meaning: "m", communities: ["meme"], platforms: ["facebook"], firstSeenAt: "2026-10-15", review: "pending", approvedBy: null, sources: [] },
];
const binding: PostBinding = { postId: "p1", storyId: "st1", dossierUrl: "https://toibingu.vn/vu/et-o-et", quickTake: "Một câu nói trong buổi stream bị dùng lại với nghĩa ngược.", published: true };
const ev = (over: Partial<CommentEvent> = {}): CommentEvent => ({ commentId: "c1", postId: "p1", fromId: "u1", fromPage: false, message: "Tôi bị ngu", createdAt: "2026-10-16T03:00:00Z", ...over });

test("a 'Tôi bị ngu' comment on our post gets a delayed, disclosed reply with the quick take and a tracked link", () => {
  const d = decideReply(ev(), binding, newReplyState(), lexicon);
  assert.equal(d.action, "reply");
  if (d.action !== "reply") return;
  const delay = (new Date(d.at).getTime() - new Date("2026-10-16T03:00:00Z").getTime()) / 1000;
  assert.ok(delay >= REPLY_CONFIG.minDelaySec && delay <= REPLY_CONFIG.maxDelaySec, `delay ${delay}s`);
  assert.match(d.text, /Một câu nói trong buổi stream/);
  assert.match(d.text, /https:\/\/toibingu\.vn\/vu\/et-o-et\?ref=fb-st1/);
  assert.ok(d.text.endsWith(DISCLOSURE));
  assert.equal(d.mentionId, "u1");
});

test("spellings the lexicon knows trigger; other comments do not", () => {
  assert.equal(decideReply(ev({ message: "t bi ngu qua" }), binding, newReplyState(), lexicon).action, "reply");
  assert.deepEqual(decideReply(ev({ message: "hay quá" }), binding, newReplyState(), lexicon), { action: "skip", commentId: "c1", reason: "not_trigger" });
});

test("never answers itself, unbound posts or unpublished dossiers", () => {
  assert.equal((decideReply(ev({ fromPage: true }), binding, newReplyState(), lexicon) as { reason: string }).reason, "from_page");
  assert.equal((decideReply(ev(), undefined, newReplyState(), lexicon) as { reason: string }).reason, "post_not_bound");
  assert.equal((decideReply(ev(), { ...binding, published: false }, newReplyState(), lexicon) as { reason: string }).reason, "dossier_not_published");
});

test("one answer per person per post, and per comment when the id is missing", () => {
  const s = newReplyState();
  assert.equal(decideReply(ev(), binding, s, lexicon).action, "reply");
  assert.equal((decideReply(ev({ commentId: "c2" }), binding, s, lexicon) as { reason: string }).reason, "already_answered");
  assert.equal(decideReply(ev({ commentId: "c3", fromId: "u2" }), binding, s, lexicon).action, "reply");
  const anon = newReplyState();
  const noId = ev({ commentId: "c9" });
  delete (noId as { fromId?: string }).fromId;
  assert.equal(decideReply(noId, binding, anon, lexicon).action, "reply");
  assert.equal((decideReply(noId, binding, anon, lexicon) as { reason: string }).reason, "already_answered");
});

test("hourly cap per post", () => {
  const s = newReplyState();
  for (let i = 0; i < REPLY_CONFIG.maxRepliesPerPostPerHour; i++) {
    assert.equal(decideReply(ev({ commentId: `c${i}`, fromId: `u${i}` }), binding, s, lexicon).action, "reply");
  }
  assert.equal((decideReply(ev({ commentId: "cx", fromId: "ux" }), binding, s, lexicon) as { reason: string }).reason, "post_rate_limited");
});

test("openers vary across comments and quick takes are clipped", () => {
  const texts = new Set(Array.from({ length: 40 }, (_, i) => composeReply({ commentId: `c${i}`, quickTake: "x", dossierUrl: "https://toibingu.vn/vu/a", refCode: "r" }).split(" x ")[0]));
  assert.ok(texts.size >= 3, "replies are not identical");
  for (const t of texts) assert.ok(OPENERS.some((o) => t === o));
  const long = composeReply({ commentId: "c", quickTake: "a".repeat(500), dossierUrl: "https://toibingu.vn/vu/a", refCode: "r" });
  assert.ok(long.length < 420);
});
