/** Minimal HTML helpers. Every value that reaches the page goes through `esc` (dossier text is editor input). */
export function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/** JSON inside <script type="application/ld+json">: block `</script>` breakouts. */
export function jsonForScript(v: unknown): string {
  return JSON.stringify(v).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}

const CSS = `
:root{--bg:#fffdf8;--fg:#1c1b19;--muted:#6b675f;--card:#fff;--line:#e9e4d8;--accent:#d9480f;--warn-bg:#fff4e0;--warn-fg:#8a4b00;--ok:#2b8a3e;--bad:#c92a2a}
@media (prefers-color-scheme:dark){:root{--bg:#141311;--fg:#f1eee8;--muted:#a7a196;--card:#1d1c19;--line:#33302a;--accent:#ff8a4c;--warn-bg:#3a2a12;--warn-fg:#ffcf8a;--ok:#69db7c;--bad:#ff8787}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,"Noto Sans",sans-serif}
main{max-width:680px;margin:0 auto;padding:16px}a{color:var(--accent)}h1{font-size:1.6rem;line-height:1.25;margin:.4em 0}h2{font-size:1.1rem;margin:1.4em 0 .4em}
.brand{font-weight:800;text-decoration:none;color:var(--fg)}.tag{color:var(--muted);font-size:.85rem}
.scope{color:var(--muted);font-size:.85rem;margin:.2em 0 1em}.tabs{display:flex;gap:8px;flex-wrap:wrap;margin:8px 0 16px}.tabs span{border:1px solid var(--line);border-radius:999px;padding:4px 10px;font-size:.85rem}
.card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px;margin:12px 0}.card h3{margin:0 0 6px;font-size:1.05rem}.card a{text-decoration:none;color:var(--fg)}
.missed{border-left:3px solid var(--accent);padding-left:10px;margin:8px 0}.banner{background:var(--warn-bg);color:var(--warn-fg);border-radius:10px;padding:10px 12px;margin:12px 0;font-weight:600}
.label{display:inline-block;font-size:.75rem;font-weight:700;border-radius:6px;padding:1px 6px;margin-right:6px;border:1px solid currentColor}
.l-confirmed{color:var(--ok)}.l-circulating,.l-disputed{color:var(--warn-fg)}.l-debunked{color:var(--bad)}
details{border-top:1px solid var(--line);padding:8px 0}summary{cursor:pointer;font-weight:600}ol,ul{padding-left:1.2em}
.meta{color:var(--muted);font-size:.85rem}.share{display:flex;gap:8px;margin:16px 0}.share button,.share a{font:inherit;border:1px solid var(--line);background:var(--card);color:var(--fg);border-radius:10px;padding:8px 12px;text-decoration:none;cursor:pointer}
footer{color:var(--muted);font-size:.8rem;margin:32px 0 16px}
`;

export interface PageMeta {
  title: string;
  description: string;
  canonical: string;
  jsonLd?: unknown;
  noindex?: boolean;
}

export function page(m: PageMeta, body: string): string {
  return `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(m.title)}</title><meta name="description" content="${esc(m.description)}"><link rel="canonical" href="${esc(m.canonical)}">
<meta property="og:type" content="article"><meta property="og:title" content="${esc(m.title)}"><meta property="og:description" content="${esc(m.description)}"><meta property="og:url" content="${esc(m.canonical)}"><meta property="og:locale" content="vi_VN">
${m.noindex ? '<meta name="robots" content="noindex">' : ""}${m.jsonLd ? `<script type="application/ld+json">${jsonForScript(m.jsonLd)}</script>` : ""}
<style>${CSS}</style></head><body><main>
<header><a class="brand" href="/">Toibingu</a> <span class="tag">Không phải tôi ngu. Tôi chưa xem tập trước.</span></header>
${body}
<footer>Toibingu: bắt kịp chuyện đang hot ngoài feed của bạn.</footer>
</main></body></html>
`;
}
