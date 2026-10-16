import { test } from "node:test";
import assert from "node:assert/strict";
import { validateLexicon } from "../src/validate.ts";
import { LEX, term } from "./fixtures.ts";

test("fixture lexicon is valid", () => {
  assert.deepEqual(validateLexicon(LEX), []);
});

test("approved non-brand term needs a source and an approver", () => {
  const errs = validateLexicon([term({ id: "rizz", display: "rizz", review: "approved", approvedBy: null })]);
  assert.ok(errs.some((e) => e.includes("approvedBy")));
  assert.ok(errs.some((e) => e.includes("at least one source")));
});

test("variant collisions across terms are caught", () => {
  const errs = validateLexicon([term({ id: "a", display: "thông não" }), term({ id: "b", display: "thong nao" })]);
  assert.ok(errs.some((e) => e.includes("collides with term a")));
});

test("scraped or non-https sources are rejected", () => {
  const bad = term({
    id: "x",
    display: "x",
    sources: [{ url: "http://x", platform: "web", retrievedAt: "2026-10-16", accessMethod: "scraped" as never }],
  });
  const errs = validateLexicon([bad]);
  assert.ok(errs.some((e) => e.includes("not allowed")));
  assert.ok(errs.some((e) => e.includes("https")));
});
