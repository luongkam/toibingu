import { test } from "node:test";
import assert from "node:assert/strict";
import type { Entry } from "../src/render.ts";
import { renderDossier, renderHome, SCOPE_LABEL } from "../src/render.ts";
import { buildSite } from "../src/site.ts";

const O = { baseUrl: "https://toibingu.vn" };
const INFO = { sha: "abc1234", builtAt: "2026-10-16T00:00:00Z" };

const entry = (over: { slug?: string; status?: Entry["story"]["status"]; approvedBy?: string | null; headline?: string } = {}): Entry => ({
  story: {
    id: `st_${over.slug ?? "a"}`, slug: over.slug ?? "vu-a", headline: over.headline ?? "Sao ai cũng nói “ét o ét”?", status: over.status ?? "published",
    originCommunity: "game", spreadingIn: ["game", "meme"], firstSeenAt: "2026-10-14T00:00:00Z", lastActivityAt: "2026-10-16T00:00:00Z", memberPostIds: [],
  },
  dossier: {
    storyId: `st_${over.slug ?? "a"}`, quickTake: "Một câu nói trong stream bị dùng lại với nghĩa ngược. Câu thứ hai.", missedPart: "Câu gốc ở phút 40. Rồi bị chế.", whyHotNow: "Nhãn hàng dùng lại.",
    whereHot: [{ community: "game", platforms: ["threads"] }], decoder: [], timeline: [],
    claims: [{ id: "c1", text: "Clip gốc là thật", status: "confirmed", sourceIds: ["s1"] }],
    sources: [{ id: "s1", url: "https://example.com/1", platform: "threads", retrievedAt: "2026-10-15T00:00:00Z", visibility: "public", accessMethod: "official_api" }],
    communityExplanations: [], compiledAt: "2026-10-15T00:00:00Z", updatedAt: "2026-10-16T00:00:00Z",
    approvedBy: over.approvedBy === undefined ? "editor_1" : over.approvedBy,
  },
});

test("home: brand question, honest scope label, card says where it is hot and what you missed", () => {
  const html = renderHome([entry()], O);
  assert.match(html, /Hôm nay bạn bỏ lỡ vụ gì\?/);
  assert.ok(html.includes(SCOPE_LABEL));
  assert.match(html, /Bắt đầu từ cộng đồng game, đang lan sang cộng đồng meme\./);
  assert.match(html, /Bạn thiếu đoạn này:<\/strong> Câu gốc ở phút 40\./);
  assert.doesNotMatch(html, /hot nhất Việt Nam/i);
});

test("dossier: three default sections in order, readable without JS, no login form", () => {
  const html = renderDossier(entry(), O);
  const i = (s: string) => html.indexOf(s);
  assert.ok(i("Hiểu nhanh") < i("Đoạn bạn bỏ lỡ") && i("Đoạn bạn bỏ lỡ") < i("Vì sao đang hot"));
  const withoutScripts = html.replace(/<script[\s\S]*?<\/script>/g, "");
  assert.match(withoutScripts, /Một câu nói trong stream/);
  assert.doesNotMatch(html, /type="password"|đăng nhập/i);
  assert.match(html, /<span class="label l-confirmed">Đã xác nhận<\/span>/);
  assert.match(html, /"@type":"ClaimReview"/);
});

test("editor text is escaped everywhere, including JSON-LD", () => {
  const html = renderDossier(entry({ headline: `</script><img src=x onerror=alert(1)>"` }), O);
  assert.doesNotMatch(html, /<img src=x/);
  assert.doesNotMatch(html, /<\/script><img/);
});

test("'Đang xác minh' banner follows the claims the quick take rests on", () => {
  const e = entry();
  assert.doesNotMatch(renderDossier(e, O), /Đang xác minh/);
  e.dossier.claims.push({ id: "c2", text: "tin đồn", status: "circulating", sourceIds: [] });
  e.dossier.quickTakeClaimIds = ["c2"];
  assert.match(renderDossier(e, O), /Đang xác minh/);
});

test("public build: drafts are left out, published entries must pass the publish gate", () => {
  const files = buildSite([entry({ slug: "pub" }), entry({ slug: "draft", status: "drafting", approvedBy: null })], O, INFO);
  assert.ok(files.has("/vu/pub/index.html"));
  assert.ok(!files.has("/vu/draft/index.html"));
  assert.doesNotMatch(files.get("/index.html")!, /\/vu\/draft\//);
  assert.deepEqual(JSON.parse(files.get("/api/version.json")!), { sha: "abc1234", builtAt: "2026-10-16T00:00:00Z", dossiers: 1, preview: false });
  const broken = entry({ slug: "bad" });
  broken.dossier.sources = [];
  assert.throws(() => buildSite([broken], O, INFO), /bad: marked published but fails the publish gate: no_sources/);
});

test("preview build shows drafts with a draft banner and noindex", () => {
  const files = buildSite([entry({ slug: "draft", status: "drafting", approvedBy: null })], { ...O, preview: true }, INFO);
  const html = files.get("/vu/draft/index.html")!;
  assert.match(html, /BẢN NHÁP/);
  assert.match(html, /<meta name="robots" content="noindex">/);
});
