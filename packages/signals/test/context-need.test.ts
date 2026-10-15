import { test } from "node:test";
import assert from "node:assert/strict";
import { contextNeed } from "../src/context-need.ts";

const base = { independentRequesters: 0, tellMeRate: 0, stillConfusedRate: 0 };

test("no signal means no need", () => {
  assert.equal(contextNeed(base), 0);
});

test("more independent requesters means more need, saturating at the cap", () => {
  const a = contextNeed({ ...base, independentRequesters: 5 });
  const b = contextNeed({ ...base, independentRequesters: 30 });
  assert.ok(b > a && a > 0);
  assert.equal(contextNeed({ ...base, independentRequesters: 50 }), contextNeed({ ...base, independentRequesters: 5000 }));
});

test("stays within 0..1 on bad input", () => {
  const v = contextNeed({ independentRequesters: -3, tellMeRate: 9, stillConfusedRate: Number.NaN });
  assert.ok(v >= 0 && v <= 1);
});
