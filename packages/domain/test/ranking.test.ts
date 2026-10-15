import { test } from "node:test";
import assert from "node:assert/strict";
import { heat, priority, sourceHeat } from "../src/ranking.ts";

test("source at or below its baseline has no heat", () => {
  assert.equal(sourceHeat(1), 0);
  assert.equal(sourceHeat(0.5), 0);
  assert.equal(sourceHeat(Number.NaN), 0);
});

test("source heat saturates at maxGrowth", () => {
  assert.equal(sourceHeat(8), 1);
  assert.equal(sourceHeat(1000), 1);
});

test("reposts inside one community do not stack", () => {
  const one = heat([{ sourceId: "a", community: "game", growthRatio: 4 }]);
  const many = heat(
    Array.from({ length: 20 }, (_, i) => ({ sourceId: `s${i}`, community: "game" as const, growthRatio: 4 })),
  );
  assert.equal(many, one);
});

test("spreading across communities beats the same peak in one community", () => {
  const single = heat([{ sourceId: "a", community: "game", growthRatio: 4 }]);
  const spread = heat([
    { sourceId: "a", community: "game", growthRatio: 4 },
    { sourceId: "b", community: "meme", growthRatio: 3 },
    { sourceId: "c", community: "tech", growthRatio: 2 },
  ]);
  assert.ok(spread > single);
});

test("a hot story nobody needs explained ranks below a warm story people keep asking about", () => {
  const hotButObvious = priority({
    growth: [{ sourceId: "a", community: "entertainment", growthRatio: 8 }],
    contextNeed: 0,
    relevance: 0.5,
  });
  const warmButConfusing = priority({
    growth: [{ sourceId: "b", community: "game", growthRatio: 3 }],
    contextNeed: 0.9,
    relevance: 0.5,
  });
  assert.ok(warmButConfusing > hotButObvious);
});

test("priority stays within 0..1 for out-of-range inputs", () => {
  const p = priority({ growth: [{ sourceId: "a", community: "meme", growthRatio: 99 }], contextNeed: 5, relevance: -1 });
  assert.ok(p >= 0 && p <= 1);
});
