import { test } from "node:test";
import assert from "node:assert/strict";
import { isPublic, trendState } from "../src/trend.ts";

test("spread across communities makes a term hot sooner than one community", () => {
  assert.equal(trendState({ growthRatio: 4, communities: 2, daysSinceSeen: 0 }), "hot");
  assert.equal(trendState({ growthRatio: 4, communities: 1, daysSinceSeen: 0 }), "emerging");
  assert.equal(trendState({ growthRatio: 8, communities: 1, daysSinceSeen: 0 }), "hot");
});

test("quiet terms fade, unseen terms go dormant unless evergreen", () => {
  assert.equal(trendState({ growthRatio: 1, communities: 1, daysSinceSeen: 3 }), "fading");
  assert.equal(trendState({ growthRatio: 1, communities: 1, daysSinceSeen: 30 }), "dormant");
  assert.equal(trendState({ growthRatio: 1, communities: 1, daysSinceSeen: 30 }, true), "fading");
});

test("heat never makes a term public; only an approving editor does", () => {
  assert.equal(isPublic({ review: "pending", approvedBy: null }), false);
  assert.equal(isPublic({ review: "approved", approvedBy: null }), false);
  assert.equal(isPublic({ review: "approved", approvedBy: "editor_1" }), true);
});
