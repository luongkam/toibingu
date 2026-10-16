import { test } from "node:test";
import assert from "node:assert/strict";
import { findTerms, slugify } from "../src/match.ts";
import { LEX } from "./fixtures.ts";

test("longest term wins and matches do not overlap", () => {
  assert.deepEqual(findTerms("Chào mừng tới Hội tối cổ", LEX), ["hoi-toi-co"]);
  assert.deepEqual(findTerms("Ai là Thánh thông não tuần này?", LEX), ["thanh-thong-nao"]);
});

test("folded and teen-code spellings match", () => {
  assert.deepEqual(findTerms("t bi ngu qua, ai thong nao di", LEX), ["toi-bi-ngu", "thong-nao"]);
});

test("accented-only terms ignore their folded collisions", () => {
  assert.deepEqual(findTerms("Tôi có việc, mai hỏi tôi có được không", LEX), []);
  assert.deepEqual(findTerms("hoi toi co duoc khong", LEX), []);
  assert.deepEqual(findTerms("đúng là tối cổ thật", LEX), ["toi-co"]);
});

test("slugify folds diacritics and đ", () => {
  assert.equal(slugify("Hội tối cổ"), "hoi-toi-co");
  assert.equal(slugify("Đỉnh nóc, kịch trần!"), "dinh-noc-kich-tran");
});
