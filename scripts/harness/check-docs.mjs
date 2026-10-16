#!/usr/bin/env node
// NEXA harness starter: RD (01-rd) and SD (01-sd) document checker. Zero dependencies, ESM, Node >= 18.
// Same rules as NEXA's G1 (packages/validation/src/rd-gate.ts), G1_5 (sd-gate.ts) and doc ids (naming-rule.ts);
// NEXA's packages/templates/test/harness-check-docs.test.ts runs both on one corpus, so this copy cannot drift.
// Extra rules: SD file sits in its type folder, frontmatter doc_id = file id, status is a NEXA ArtifactStatus, domain
// is in .nexa/domain-registry.json, SD-INDEX.md lists every SD, no em dash (U+2014) in RD/SD, nothing under
// 02-bd/system-design (SD is its own phase, D8); optional: frontmatter required, depends_on must resolve.
// Usage: node scripts/harness/check-docs.mjs [docs-root] [--json]   (exit 1 on any FAIL)
// Project settings: harness.config.mjs `docs: { root, rdFiles, emDash, requireFrontmatter, checkDependsOn, domainRegistry,
// rules: [(doc) => string[]] }`.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const EM_DASH = '—';

// ---- naming-rule.ts ----
export const SD_TYPE_FOLDERS = { X: 'system-context', H: 'architecture', N: 'nfr', I: 'integration-architecture', Y: 'data-architecture', P: 'common-policy' };
const DOC_ID = /^(RD|SD|BD|DD)-([A-Z]{2,4})([TSABRECXHNIYP])([A-Z0-9_]{3,})$/;
/** `SD-ACMX001` → { phase, domain, type, sequence }, or null (SD ids take X/H/N/I/Y/P, the others T/S/A/B/R/E/C). */
export function parseDocId(id) {
  const m = DOC_ID.exec(id);
  if (!m) return null;
  const [, phase, domain, type, sequence] = m;
  if ((phase === 'SD') !== Object.hasOwn(SD_TYPE_FOLDERS, type)) return null;
  return { phase, domain, type, sequence };
}

// ---- semantic-checks.ts ----
const CANNED_MARKERS = [
  'Extracted business goals from provided customer input',
  'Customer-provided requirement sources are consolidated',
  'Validate input\n- Execute business logic\n- Return result',
  'DB access: none in generated battle-test scaffold',
  'None for MVP battle test',
];
const hasCannedMarkers = (body) => CANNED_MARKERS.some((m) => body.includes(m));
const wordCount = (body) => body.trim().split(/\s+/).filter(Boolean).length;
function countSpecificTerms(body) {
  const terms = new Set();
  for (const m of body.matchAll(/`([^`]{3,80})`/g)) terms.add(m[1]);
  for (const m of body.matchAll(/\b[A-Z]{2,}-[A-Z0-9-]{2,}\b/g)) terms.add(m[0]);
  for (const m of body.matchAll(/\b[A-Za-z]+(?:Service|Controller|Module|Input|Output|Repository|Item)\d*\b/g)) terms.add(m[0]);
  return terms.size;
}

// ---- rd-gate.ts (G1) ----
const RD_HEADINGS = [
  ['rd.overview', /## 1\. (業務概要|Business Overview)/],
  ['rd.scope', /## (3|4|.+)\. (対象範囲|Scope)/],
  ['rd.outOfScope', /(対象外|Out of scope)/i],
  ['rd.openQuestions', /(未確定事項|Open questions)/i],
  ['rd.customerConfirmations', /(顧客確認事項|Customer confirmation)/i],
];
/** G1 checks for one RD body: [{ id, passed, optional? }]. */
export function rdChecks(body) {
  return [
    ...RD_HEADINGS.map(([id, re]) => ({ id, passed: re.test(body) })),
    { id: 'rd.specificity', passed: wordCount(body) > 200 || countSpecificTerms(body) >= 3 },
    { id: 'rd.kbCoverage', passed: /(module|business rule|データモデル|Data Model|Integration|Non-Functional|source:|00-intake\/knowledge)/i.test(body) },
    { id: 'rd.noGenericMarkers', passed: !hasCannedMarkers(body) },
  ];
}

// ---- sd-gate.ts (G1_5) ----
const SD_ID = /^SD-[A-Z]{2,4}[XHNIYP][A-Z0-9_]{3,}$/;
const RD_REF = /\bRD-[A-Z]{2,4}[TSABRECXHNIYP]\d{3}\b|01-rd\//;
const SD_HEADINGS = [
  ['sd.purpose', /(システム概要|設計定義の目的|Purpose|System Overview)/i],
  ['sd.boundary', /(システム境界|対象範囲|System boundary|Scope)/i],
  ['sd.decisions', /(方式設計|設計方針|Design decisions|Architecture)/i],
];
/** G1_5 checks for one SD artifact id + body; a non-SD id gets the gate's no-op PASS. */
export function sdChecks(id, body) {
  if (!SD_ID.test(id || '')) return [{ id: 'sd.applicable', passed: true }];
  return [
    ...SD_HEADINGS.map(([cid, re]) => ({ id: cid, passed: re.test(body) })),
    { id: 'sd.idValid', passed: SD_ID.test(id) },
    { id: 'sd.traceRd', passed: RD_REF.test(body) },
    { id: 'sd.nfrOrIntegration', passed: /(非機能|Non-?functional|NFR|integration|連携|data architecture|データ)/i.test(body) },
    { id: 'sd.specificity', passed: wordCount(body) > 150 },
    { id: 'sd.noGenericMarkers', passed: !hasCannedMarkers(body) },
    { id: 'sd.notDetailedDesign', passed: !/(CREATE TABLE|SELECT\s.+\sFROM\s|ロジックブロック|logic block)/i.test(body), optional: true },
  ];
}

// ---- extra rules ----
/** 1-based line numbers that hold an em dash (U+2014). */
export const emDashLines = (body) => body.split('\n').flatMap((l, i) => (l.includes(EM_DASH) ? [i + 1] : []));
export function frontmatter(body) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(body);
  if (!m) return {};
  return Object.fromEntries(m[1].split(/\r?\n/).map((l) => /^([\w-]+):\s*(.*)$/.exec(l)).filter(Boolean).map(([, k, v]) => [k, v.replace(/^["']|["']$/g, '').trim()]));
}
const fileId = (name) => /^((?:RD|SD|BD|DD)-[A-Z0-9_]+)(?=[-.])/.exec(name)?.[1] ?? null;
function walk(dir) {
  if (!existsSync(dir)) return [];
  // `_review/` holds the phase's review records (NEXA layout), not RD/SD documents.
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? (e.name === '_review' ? [] : walk(join(dir, e.name))) : e.name.endsWith('.md') ? [join(dir, e.name)] : []));
}
const DEFAULT_RD_FILES = /^RD-[A-Z0-9_]+[-.].*\.md$/;
// packages/document-control/src/artifact-matrix.ts ArtifactStatusSchema.
export const ARTIFACT_STATUSES = ['NOT_STARTED', 'INPUT_REQUIRED', 'DRAFTING', 'AI_GENERATED', 'INTERNAL_REVIEW', 'CUSTOMER_REVIEW', 'APPROVED', 'NEED_FIX', 'BLOCKED', 'DONE'];
const listOf = (v) => (v || '').replace(/^\[|\]$/g, '').split(',').map((x) => x.trim()).filter(Boolean);
// NEXA keeps domain codes in <project>/.nexa/domain-registry.json (NamingValidator); docs may sit one level down.
function domainCodes(root, path) {
  const file = path ? resolve(root, path) : [join(root, '.nexa/domain-registry.json'), join(root, '../.nexa/domain-registry.json')].find(existsSync);
  if (!file || !existsSync(file)) return null;
  return new Set((JSON.parse(readFileSync(file, 'utf8')).domains || []).map((d) => d.code));
}

/**
 * Checks every RD/SD document under `root` (the folder that holds 01-rd / 01-sd).
 * Options: rdFiles (which 01-rd files are RD docs), emDash, requireFrontmatter (doc_id must be present),
 * checkDependsOn (every depends_on id is a doc in this tree), domainRegistry (path), rules (project rules).
 * Returns { rd, sd, problems: [{ file, rule, message }], warnings: [same] }.
 */
export function checkDocs(root, { rdFiles = DEFAULT_RD_FILES, emDash = true, requireFrontmatter = false, checkDependsOn = false, domainRegistry, rules = [] } = {}) {
  const problems = [];
  const warnings = [];
  const rel = (f) => relative(root, f).split(sep).join('/');
  const fail = (file, rule, message) => problems.push({ file, rule, message });
  const domains = domainCodes(root, domainRegistry);
  const docs = [];
  let rd = 0;
  let sd = 0;

  for (const f of walk(join(root, '02-bd', 'system-design'))) fail(rel(f), 'sd.location', 'SD thuộc phase riêng 01-sd/<loại>/ (D8), không đặt trong 02-bd/system-design');

  // Rules every RD/SD document shares: frontmatter doc_id = file id, NEXA status, registered domain.
  const common = (file, id, parsed, fm) => {
    if (!Object.keys(fm).length) { if (requireFrontmatter) fail(file, 'doc.frontmatter', 'thiếu frontmatter (doc_id, status, depends_on)'); }
    else if (fm.doc_id !== id && (fm.doc_id || requireFrontmatter)) fail(file, 'doc.frontmatterId', `frontmatter doc_id "${fm.doc_id ?? ''}" khác id tên file "${id}"`);
    if (fm.status && !ARTIFACT_STATUSES.includes(fm.status)) fail(file, 'doc.status', `status "${fm.status}" không phải trạng thái NEXA (${ARTIFACT_STATUSES.join(' | ')})`);
    if (domains && parsed && !domains.has(parsed.domain)) fail(file, 'doc.domain', `domain ${parsed.domain} chưa có trong .nexa/domain-registry.json`);
  };
  const run = (file, kind, id, body) => {
    if (emDash) for (const n of emDashLines(body)) fail(file, 'doc.noEmDash', `dòng ${n} có em dash (U+2014); dùng "-"`);
    for (const rule of rules) for (const message of rule({ file, kind, id, body, frontmatter: frontmatter(body) }) || []) fail(file, 'project', message);
  };

  for (const f of walk(join(root, '01-rd'))) {
    const file = rel(f);
    const name = file.split('/').pop();
    const body = readFileSync(f, 'utf8');
    const isDoc = rdFiles.test(name) && !/-INDEX\.md$/.test(name);
    const id = isDoc ? fileId(name) : null;
    if (isDoc) {
      rd += 1;
      const parsed = id && parseDocId(id);
      if (name.startsWith('RD-') && (!parsed || parsed.phase !== 'RD')) fail(file, 'rd.idValid', `"${id ?? name}" không phải id RD hợp lệ (RD-{DOMAIN}{T|S|A|B|R|E|C}{NNN})`);
      if (id) { common(file, id, parsed, frontmatter(body)); docs.push({ file, id, body }); }
      for (const c of rdChecks(body)) if (!c.passed) fail(file, `G1 ${c.id}`, 'không đạt');
    }
    run(file, isDoc ? 'rd' : 'rd-other', id, body);
  }

  const sdDir = join(root, '01-sd');
  const index = existsSync(join(sdDir, 'SD-INDEX.md')) ? readFileSync(join(sdDir, 'SD-INDEX.md'), 'utf8') : null;
  for (const f of walk(sdDir)) {
    const file = rel(f);
    const name = file.split('/').pop();
    const body = readFileSync(f, 'utf8');
    const id = fileId(name);
    const isDoc = Boolean(id) && name.startsWith('SD-') && name !== 'SD-INDEX.md';
    if (isDoc) {
      sd += 1;
      docs.push({ file, id, body });
      const parsed = parseDocId(id);
      if (!parsed || parsed.phase !== 'SD') fail(file, 'sd.idValid', `"${id}" không phải id SD hợp lệ (SD-{DOMAIN}{X|H|N|I|Y|P}{NNN})`);
      else {
        const want = `01-sd/${SD_TYPE_FOLDERS[parsed.type]}`;
        if (rel(dirname(f)) !== want) fail(file, 'sd.folder', `loại ${parsed.type} nằm ở ${want}/`);
      }
      common(file, id, parsed, frontmatter(body));
      if (index === null) fail(file, 'sd.index', '01-sd/SD-INDEX.md không tồn tại');
      else if (!new RegExp(`\\b${id}\\b`).test(index)) fail(file, 'sd.index', `${id} chưa có trong SD-INDEX.md`);
      for (const c of sdChecks(id, body)) {
        if (c.passed) continue;
        (c.optional ? warnings : problems).push({ file, rule: `G1_5 ${c.id}`, message: c.optional ? 'không đạt (optional)' : 'không đạt' });
      }
    }
    run(file, isDoc ? 'sd' : 'sd-other', isDoc ? id : null, body);
  }
  const known = new Set(docs.map((d) => d.id));
  if (index !== null) {
    for (const m of index.matchAll(/\bSD-[A-Z0-9_]+\b/g)) {
      if (m[0] !== 'SD-INDEX' && parseDocId(m[0]) && !known.has(m[0])) fail('01-sd/SD-INDEX.md', 'sd.index', `${m[0]} có trong index nhưng không có file`);
    }
  }
  // Same idea as NEXA cross-ref-gate (orphans): a dependency must resolve to a document.
  if (checkDependsOn) {
    for (const { file, body } of docs) {
      for (const dep of listOf(frontmatter(body).depends_on)) if (!known.has(dep)) fail(file, 'doc.dependsOn', `depends_on ${dep} không có tài liệu`);
    }
  }
  return { rd, sd, problems: dedupe(problems), warnings };
}
const dedupe = (list) => [...new Map(list.map((p) => [`${p.file}\0${p.rule}\0${p.message}`, p])).values()];

async function main() {
  const here = dirname(fileURLToPath(import.meta.url));
  const repo = resolve(here, '../..');
  const cfgFile = join(here, 'harness.config.mjs');
  const cfg = existsSync(cfgFile) ? ((await import(pathToFileURL(cfgFile).href)).default?.docs || {}) : {};
  const args = process.argv.slice(2).filter((a) => a !== '--' && a !== '--json');
  const json = process.argv.includes('--json');
  const has = (d) => existsSync(join(d, '01-rd')) || existsSync(join(d, '01-sd')) || existsSync(join(d, '02-bd'));
  const root = args[0] ? resolve(args[0]) : cfg.root ? resolve(repo, cfg.root) : [join(repo, 'docs'), repo].find(has);
  if (!root || !has(root)) {
    console.log(`check-docs: không có 01-rd/01-sd (${args[0] || cfg.root || 'docs/ hoặc gốc repo'}); không có gì để kiểm`);
    return 0;
  }
  const r = checkDocs(root, cfg);
  if (json) console.log(JSON.stringify(r, null, 2));
  else {
    for (const p of r.problems) console.log(`FAIL ${p.file}: ${p.rule} ${p.message}`);
    for (const w of r.warnings) console.log(`WARN ${w.file}: ${w.rule} ${w.message}`);
    console.log(`check-docs: ${relative(process.cwd(), root) || '.'} · RD ${r.rd} · SD ${r.sd} · FAIL ${r.problems.length} · WARN ${r.warnings.length}`);
  }
  return r.problems.length ? 1 : 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = await main();
