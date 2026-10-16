// Validates the reviewed lexicon and every proposals file in data/lexicon (SD-TBH001 H-15).
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { findTerms } from "../src/match.ts";
import type { Term } from "../src/term.ts";
import { validateLexicon } from "../src/validate.ts";

const DIR = join(import.meta.dirname, "../../../data/lexicon");
const terms = JSON.parse(readFileSync(join(DIR, "terms.json"), "utf8")) as Term[];
const proposalFiles = existsSync(join(DIR, "proposals"))
  ? readdirSync(join(DIR, "proposals")).filter((f) => f.endsWith(".json"))
  : [];

test("data/lexicon/terms.json is a valid lexicon", () => {
  assert.deepEqual(validateLexicon(terms), []);
});

for (const file of proposalFiles) {
  test(`proposals/${file}: pending only, valid, and new terms are not already known`, () => {
    const doc = JSON.parse(readFileSync(join(DIR, "proposals", file), "utf8")) as {
      proposals: (Term & { change?: string })[];
    };
    const known = new Set(terms.map((t) => t.id));
    for (const p of doc.proposals) {
      assert.equal(p.review, "pending", `${p.id}: agents never approve`);
      assert.equal(p.approvedBy, null, `${p.id}: agents never fill approvedBy`);
      if (p.change) assert.ok(known.has(p.id), `${p.id}: a change must target a known term`);
      else assert.deepEqual(findTerms(p.display, terms), [], `${p.id}: already in the lexicon`);
    }
    const fresh = doc.proposals.filter((p) => !p.change);
    assert.deepEqual(validateLexicon([...terms, ...fresh]), []);
  });
}
