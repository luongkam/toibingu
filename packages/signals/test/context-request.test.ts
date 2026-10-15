import { test } from "node:test";
import assert from "node:assert/strict";
import { detectContextRequest } from "../src/context-request.ts";
import { normalize } from "../src/normalize.ts";

const kinds = (t: string) => detectContextRequest(t).kinds;

test("matches with and without diacritics", () => {
  for (const t of ["Vụ gì vậy mọi người?", "vu gi vay", "VỤ GÌ THẾ", "vụ j z"]) {
    assert.deepEqual(kinds(t), ["what_happened"], t);
  }
});

test("each brief phrase is recognised", () => {
  assert.ok(kinds("Ai tóm tắt giúp với").includes("summary_please"));
  assert.ok(kinds("xin nguồn ạ").includes("source_please"));
  assert.ok(kinds("Tôi bỏ lỡ đoạn nào vậy?").includes("missed_part"));
  assert.ok(kinds("Sao mọi người cười vậy?").includes("why_everyone"));
  assert.ok(kinds("ai giải thích hộ cái").includes("explain_please"));
  assert.ok(kinds("Tôi bị ngu, ai thông não tôi với").includes("toi_bi_ngu"));
  assert.ok(kinds("Tôi bị ngu, ai thông não tôi với").includes("explain_please"));
  assert.ok(kinds("t bi ngu, trend nay la gi v").includes("toi_bi_ngu"));
});

test("'tối cổ' matches only with diacritics, so 'tôi có' is not a request", () => {
  assert.ok(kinds("Hội tối cổ đây, kể với").includes("missed_part"));
  assert.equal(detectContextRequest("Tôi có việc bận, mai nói nhé").isRequest, false);
  assert.equal(detectContextRequest("toi co viec ban").isRequest, false);
});

test("ordinary chatter is not a request", () => {
  for (const t of ["Hôm nay trời đẹp", "Mình đã xem tập 5 rồi", "Giá vàng tăng", ""]) {
    assert.equal(detectContextRequest(t).isRequest, false, t);
  }
});

test("normalize folds đ, strips punctuation and expands teen code", () => {
  assert.deepEqual(normalize("Đc  ko???"), { accented: "đc ko", folded: "duoc khong" });
});
