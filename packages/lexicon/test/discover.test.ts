import { test } from "node:test";
import assert from "node:assert/strict";
import { discoverCandidates, type AskedText } from "../src/discover.ts";
import { LEX } from "./fixtures.ts";

const asks = (text: string, n: number, community: AskedText["community"], prefix = community): AskedText[] =>
  Array.from({ length: n }, (_, i) => ({ text, community, askerId: `${prefix}-${i}` }));

test("an unknown term asked by enough independent people becomes a candidate", () => {
  const c = discoverCandidates(asks("Cho mình hỏi 'ét o ét' là gì", 5, "game"), LEX);
  assert.deepEqual(c, [{ id: "et-o-et", display: "ét o ét", independentAskers: 5, communities: ["game"] }]);
});

test("the same person asking many times counts once", () => {
  const same = Array.from({ length: 20 }, () => ({ text: "rizz là gì", community: "meme" as const, askerId: "a" }));
  assert.deepEqual(discoverCandidates(same, LEX), []);
});

test("fewer askers suffice when the question spans communities", () => {
  const c = discoverCandidates([...asks("rizz là gì", 2, "meme"), ...asks("rizz là gì", 1, "tech")], LEX);
  assert.equal(c[0]?.id, "rizz");
  assert.deepEqual(c[0]?.communities, ["meme", "tech"]);
});

test("known terms are not proposed again", () => {
  assert.deepEqual(discoverCandidates(asks("thông não là gì", 10, "meme"), LEX), []);
});
