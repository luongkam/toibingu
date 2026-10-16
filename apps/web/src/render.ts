/**
 * Static pages for the pilot (SD-TBH001 H-18): home (REQ-001/002) and dossier (REQ-004/005/006/007/012).
 * Pure functions; no login, all content readable without JavaScript (NFR-01, AC-012.2).
 */
import { needsVerifyingBanner, type CatchUpDossier, type ClaimStatus, type Community, type Story } from "@toibingu/domain";
import { esc, page } from "./html.ts";

export interface Entry {
  story: Story;
  dossier: CatchUpDossier;
}

export interface RenderOptions {
  baseUrl: string;
  /** Preview build: drafts are rendered with a "BẢN NHÁP" banner and noindex. Never for the public site. */
  preview?: boolean;
}

export const CLAIM_LABEL: Record<ClaimStatus, string> = {
  circulating: "Đang lan truyền, chưa xác minh",
  confirmed: "Đã xác nhận",
  disputed: "Còn tranh cãi",
  debunked: "Đã bị bác bỏ",
};

export const COMMUNITY_LABEL: Record<Community, string> = {
  meme: "cộng đồng meme",
  game: "cộng đồng game",
  tech: "cộng đồng công nghệ",
  entertainment: "giới giải trí",
  sports: "cộng đồng thể thao",
  other: "cộng đồng khác",
};

export const SCOPE_LABEL = "Đang hot trong các nguồn Toibingu theo dõi";

const fmtDate = (iso: string): string => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}`;
};
const firstSentence = (s: string): string => (/^[\s\S]*?[.!?…](\s|$)/.exec(s)?.[0] ?? s).trim();
export const dossierPath = (slug: string): string => `/vu/${encodeURIComponent(slug)}/`;
const isDraft = (e: Entry): boolean => e.story.status !== "published" || e.dossier.approvedBy === null;

function where(e: Entry): string {
  const spread = e.story.spreadingIn.filter((c) => c !== e.story.originCommunity);
  const from = `Bắt đầu từ ${COMMUNITY_LABEL[e.story.originCommunity]}`;
  return spread.length ? `${from}, đang lan sang ${spread.map((c) => COMMUNITY_LABEL[c]).join(", ")}.` : `${from}.`;
}

export function renderCard(e: Entry): string {
  return `<article class="card"><a href="${esc(dossierPath(e.story.slug))}"><h3>${esc(e.story.headline)}</h3></a>
<div class="meta">${esc(where(e))}</div>
<div class="missed"><strong>Bạn thiếu đoạn này:</strong> ${esc(firstSentence(e.dossier.missedPart))}</div>
<a href="${esc(dossierPath(e.story.slug))}">Kể tôi nghe →</a></article>`;
}

export function renderHome(entries: readonly Entry[], o: RenderOptions): string {
  const cards = [...entries]
    .sort((a, b) => b.story.lastActivityAt.localeCompare(a.story.lastActivityAt))
    .slice(0, 6)
    .map(renderCard)
    .join("\n");
  const body = `<h1>Hôm nay bạn bỏ lỡ vụ gì?</h1>
<p class="scope">${esc(SCOPE_LABEL)}</p>
<nav class="tabs" aria-label="Danh mục"><span>Hot ngoài feed</span><span>Cả làng đang hỏi</span><span>Có diễn biến mới</span></nav>
${cards || "<p>Chưa có vụ nào được duyệt. Quay lại sau nhé.</p>"}`;
  return page(
    { title: "Toibingu: Hôm nay bạn bỏ lỡ vụ gì?", description: "Bắt kịp chuyện đang hot ngoài feed của bạn.", canonical: `${o.baseUrl}/`, noindex: Boolean(o.preview) },
    body,
  );
}

export function claimReviewJsonLd(e: Entry, baseUrl: string): unknown[] {
  return e.dossier.claims.map((c) => ({
    "@context": "https://schema.org",
    "@type": "ClaimReview",
    url: `${baseUrl}${dossierPath(e.story.slug)}`,
    claimReviewed: c.text,
    datePublished: e.dossier.updatedAt,
    author: { "@type": "Organization", name: "Toibingu" },
    reviewRating: { "@type": "Rating", alternateName: CLAIM_LABEL[c.status] },
  }));
}

export function renderDossier(e: Entry, o: RenderOptions): string {
  const d = e.dossier;
  const src = new Map(d.sources.map((s) => [s.id, s]));
  const cite = (ids: readonly string[]): string =>
    ids
      .map((id) => src.get(id))
      .filter((s) => s !== undefined)
      .map((s, i) => ` <a href="${esc(s.url)}" rel="nofollow noopener" target="_blank">[${i + 1}]</a>`)
      .join("");
  const url = `${o.baseUrl}${dossierPath(e.story.slug)}`;
  const shareText = `Bạn không ngu. Bạn thiếu tập 1. Đây là tập 1: ${e.story.headline}`;
  const body = `${isDraft(e) ? '<div class="banner">BẢN NHÁP: chưa được biên tập viên duyệt, không công khai.</div>' : ""}
<article>
<h1>${esc(e.story.headline)}</h1>
<p class="meta">${esc(where(e))}</p>
${needsVerifyingBanner(d) ? '<div class="banner">Đang xác minh: phần tóm tắt dựa trên thông tin đang lan truyền, chưa được xác nhận.</div>' : ""}
<h2>Hiểu nhanh</h2><p>${esc(d.quickTake)}</p>
<h2>Đoạn bạn bỏ lỡ</h2><p>${esc(d.missedPart)}</p>
<h2>Vì sao đang hot</h2><p>${esc(d.whyHotNow)}</p>
<p class="meta">Biên soạn ${esc(fmtDate(d.compiledAt))} · cập nhật ${esc(fmtDate(d.updatedAt))}${d.approvedBy ? ` · duyệt bởi ${esc(d.approvedBy)}` : ""}</p>
<div class="share"><button type="button" data-share>Gửi cho bạn bè</button><a href="${esc(url)}" data-copy>Sao chép link</a></div>
${d.claims.length ? `<details open><summary>Điều gì đã xác nhận, điều gì chưa</summary><ul>${d.claims
    .map((c) => `<li><span class="label l-${c.status}">${esc(CLAIM_LABEL[c.status])}</span>${esc(c.text)}${cite(c.sourceIds)}</li>`)
    .join("")}</ul></details>` : ""}
${d.decoder.length ? `<details><summary>Giải mã cách mọi người nói</summary><ul>${d.decoder
    .map((x) => `<li><strong>${esc(x.phrase)}</strong>: ${esc(x.meaning)}${cite(x.sourceIds)}</li>`)
    .join("")}</ul></details>` : ""}
${d.timeline.length ? `<details><summary>Diễn biến</summary><ol>${d.timeline
    .map((t) => `<li>${t.happenedAt ? `<span class="meta">${esc(fmtDate(t.happenedAt))}</span> ` : t.knownAt ? `<span class="meta">biết đến ${esc(fmtDate(t.knownAt))}</span> ` : ""}${esc(t.text)}${cite(t.sourceIds)}</li>`)
    .join("")}</ol></details>` : ""}
${d.communityExplanations.length ? `<details><summary>Cộng đồng giải thích</summary><ul>${d.communityExplanations
    .map((x) => `<li>“${esc(x.excerpt)}”${cite([x.sourceId])}</li>`)
    .join("")}</ul></details>` : ""}
<details><summary>Nguồn</summary><ol>${d.sources
    .map((s) => `<li><a href="${esc(s.url)}" rel="nofollow noopener" target="_blank">${esc(s.title ?? s.url)}</a> <span class="meta">(${esc(s.platform)}, lấy ${esc(fmtDate(s.retrievedAt))})</span></li>`)
    .join("")}</ol></details>
</article>
<script>(()=>{const u=${JSON.stringify(url).replace(/</g, "\\u003c")},t=${JSON.stringify(shareText).replace(/</g, "\\u003c")};const b=document.querySelector("[data-share]");if(b)b.onclick=()=>navigator.share?navigator.share({title:document.title,text:t,url:u}).catch(()=>{}):navigator.clipboard&&navigator.clipboard.writeText(t+" "+u).then(()=>{b.textContent="Đã chép link"});const c=document.querySelector("[data-copy]");if(c)c.onclick=(e)=>{if(navigator.clipboard){e.preventDefault();navigator.clipboard.writeText(u).then(()=>{c.textContent="Đã chép"})}}})();</script>`;
  return page(
    { title: `${e.story.headline} | Toibingu`, description: firstSentence(d.quickTake), canonical: url, jsonLd: claimReviewJsonLd(e, o.baseUrl), noindex: isDraft(e) || Boolean(o.preview) },
    body,
  );
}
