import { test } from "node:test";
import assert from "node:assert/strict";
import type { CatchUpDossier } from "../src/dossier.ts";
import { checkPublishGate } from "../src/publish-gate.ts";
import { needsVerifyingBanner } from "../src/dossier.ts";

const base = (): CatchUpDossier => ({
  storyId: "st_1",
  quickTake: "Một câu nói trong buổi phát sóng bị dùng lại với nghĩa ngược.",
  missedPart: "Câu gốc xuất hiện ở phút thứ 40 của buổi stream.",
  whyHotNow: "Một nhãn hàng vừa dùng lại câu này trong quảng cáo.",
  whereHot: [{ community: "game", platforms: ["threads"] }],
  decoder: [],
  timeline: [{ knownAt: "2026-10-14", text: "Clip được đăng lại", sourceIds: ["src_1"] }],
  claims: [{ id: "c1", text: "Clip gốc là thật", status: "confirmed", sourceIds: ["src_1"] }],
  sources: [
    {
      id: "src_1",
      url: "https://example.com/post/1",
      platform: "threads",
      retrievedAt: "2026-10-15T00:00:00Z",
      visibility: "public",
      accessMethod: "official_api",
    },
  ],
  communityExplanations: [],
  compiledAt: "2026-10-15T00:00:00Z",
  updatedAt: "2026-10-15T00:00:00Z",
  approvedBy: "editor_1",
});

const codes = (d: CatchUpDossier) => checkPublishGate(d).failures.map((f) => f.code);

test("a sourced, approved dossier passes", () => {
  assert.deepEqual(checkPublishGate(base()), { ok: true, failures: [] });
});

test("unapproved dossier is blocked", () => {
  assert.deepEqual(codes({ ...base(), approvedBy: null }), ["not_approved"]);
});

test("confirmed claim needs a source", () => {
  const d = base();
  d.claims = [{ id: "c2", text: "x", status: "confirmed", sourceIds: [] }];
  assert.deepEqual(codes(d), ["confirmed_claim_without_source"]);
});

test("a circulating rumour may be published without confirmation, as long as it is labelled", () => {
  const d = base();
  d.claims.push({ id: "c3", text: "Có tin đồn rằng…", status: "circulating", sourceIds: ["src_1"] });
  assert.equal(checkPublishGate(d).ok, true);
});

test("private-group content never becomes a public source", () => {
  const d = base();
  d.sources[0] = { ...d.sources[0]!, visibility: "private" };
  assert.deepEqual(codes(d), ["private_source"]);
});

test("references to unknown sources are caught", () => {
  const d = base();
  d.communityExplanations = [{ sourceId: "ghost", excerpt: "…", selectedBy: "editor_1" }];
  assert.deepEqual(codes(d), ["dangling_source_ref"]);
});

test("empty core sections block publishing", () => {
  assert.deepEqual(codes({ ...base(), missedPart: "  " }), ["missing_section"]);
});

test("'Đang xác minh' banner only when the quick take rests on an unconfirmed claim", () => {
  const d = base();
  assert.equal(needsVerifyingBanner(d), false);
  d.claims.push({ id: "c9", text: "Có tin đồn…", status: "circulating", sourceIds: ["src_1"] });
  assert.equal(needsVerifyingBanner(d), false, "a rumour elsewhere in the dossier does not taint the quick take");
  d.quickTakeClaimIds = ["c1", "c9"];
  assert.equal(needsVerifyingBanner(d), true);
});
