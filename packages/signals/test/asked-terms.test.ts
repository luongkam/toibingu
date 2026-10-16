import { test } from "node:test";
import assert from "node:assert/strict";
import { extractAskedTerms } from "../src/asked-terms.ts";

test("quoted term wins", () => {
  assert.deepEqual(extractAskedTerms("Tôi bị ngu, 'ét o ét' là gì vậy mọi người?"), ["ét o ét"]);
  assert.deepEqual(extractAskedTerms("“Hội tối cổ” nghĩa là gì?"), ["hội tối cổ"]);
});

test("unquoted term before the question, fillers stripped", () => {
  assert.deepEqual(extractAskedTerms("Cho mình hỏi skibidi là gì"), ["skibidi"]);
  assert.deepEqual(extractAskedTerms("Tôi bị ngu, trend ăn cơm chưa là trend gì vậy"), ["ăn cơm chưa"]);
  assert.deepEqual(extractAskedTerms("thong nao la gi"), ["thong nao"]);
});

test("one question per clause, deduplicated", () => {
  assert.deepEqual(extractAskedTerms("Rizz là gì? Còn rizz là gì nữa?"), ["rizz"]);
});

test("no question, or a whole sentence before it, yields nothing", () => {
  assert.deepEqual(extractAskedTerms("Hôm nay trời đẹp"), []);
  assert.deepEqual(extractAskedTerms("Tôi không hiểu tại sao hôm qua mọi người lại cứ nói mãi là gì"), []);
  assert.deepEqual(extractAskedTerms("là gì"), []);
});
