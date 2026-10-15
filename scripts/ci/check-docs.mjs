#!/usr/bin/env node
// Doc-system check for docs/01-rd and docs/01-sd, following NEXA conventions.
// Gate rules mirror NEXA packages/validation/src/{rd-gate,sd-gate}.ts (G1, G1_5) at nexa-v3-2@d80fe5c;
// id rules mirror packages/document-control/src/naming-rule.ts. Zero dependencies.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

export const RD_ID = /^RD-([A-Z]{2,4})[TSABRECXHNIYP]\d{3}$/;
export const SD_ID = /^SD-([A-Z]{2,4})([XHNIYP])\d{3}$/;
export const SD_FOLDER = { X: 'system-context', H: 'architecture', N: 'nfr', I: 'integration-architecture', Y: 'data-architecture', P: 'common-policy' };
const RD_REF = /\bRD-[A-Z]{2,4}[TSABRECXHNIYP]\d{3}\b|01-rd\//;

const RD_GATE = [
  ['rd.overview', /## 1\. (業務概要|Business Overview)/],
  ['rd.scope', /## (3|4|.+)\. (対象範囲|Scope)/],
  ['rd.outOfScope', /(対象外|Out of scope)/i],
  ['rd.openQuestions', /(未確定事項|Open questions)/i],
  ['rd.customerConfirmations', /(顧客確認事項|Customer confirmation)/i],
  ['rd.kbCoverage', /(module|business rule|データモデル|Data Model|Integration|Non-Functional|source:|00-intake\/knowledge)/i],
];
const SD_GATE = [
  ['sd.purpose', /(システム概要|設計定義の目的|Purpose|System Overview)/i],
  ['sd.boundary', /(システム境界|対象範囲|System boundary|Scope)/i],
  ['sd.decisions', /(方式設計|設計方針|Design decisions|Architecture)/i],
  ['sd.traceRd', RD_REF],
  ['sd.nfrOrIntegration', /(非機能|Non-?functional|NFR|integration|連携|data architecture|データ)/i],
];
// Detailed-design content does not belong in SD (NEXA sd-gate optional check).
const SD_FORBIDDEN = /\bCREATE\s+TABLE\b|\bSELECT\b[\s\S]{0,200}?\bFROM\b|ロジックブロック|logic block/i;

const words = (s) => s.trim().split(/\s+/).filter(Boolean).length;

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? (n === '_review' ? [] : walk(p)) : p.endsWith('.md') ? [p] : [];
  });
}

function frontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) return null;
  const out = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([a-z_]+):\s*(.*)$/);
    if (kv) out[kv[1]] = kv[2].trim();
  }
  return out;
}

export function checkDocs(root) {
  const errors = [];
  const err = (file, msg) => errors.push(`${relative(root, file) || file}: ${msg}`);
  const registryPath = join(root, '.nexa/domain-registry.json');
  const domains = existsSync(registryPath)
    ? new Set(JSON.parse(readFileSync(registryPath, 'utf8')).domains.map((d) => d.code))
    : null;
  const rdFiles = walk(join(root, 'docs/01-rd'));
  const sdFiles = walk(join(root, 'docs/01-sd')).filter((f) => basename(f) !== 'SD-INDEX.md');
  const known = new Set();
  const docs = [];

  for (const file of [...rdFiles, ...sdFiles]) {
    const isSd = file.includes(`${join('docs', '01-sd')}`);
    const id = basename(file).match(/^((?:RD|SD)-[A-Z]+\d{3})/)?.[1] ?? '';
    const text = readFileSync(file, 'utf8');
    const m = (isSd ? SD_ID : RD_ID).exec(id);
    if (!m) { err(file, `file name must start with a valid ${isSd ? 'SD' : 'RD'} id`); continue; }
    if (isSd && basename(dirname(file)) !== SD_FOLDER[m[2]]) err(file, `SD type ${m[2]} belongs in 01-sd/${SD_FOLDER[m[2]]}/`);
    if (domains && !domains.has(m[1])) err(file, `domain ${m[1]} is not in .nexa/domain-registry.json`);
    const fm = frontmatter(text);
    if (!fm) err(file, 'missing frontmatter');
    else if (fm.doc_id !== id) err(file, `frontmatter doc_id "${fm.doc_id}" must equal ${id}`);
    if (text.includes('—')) err(file, 'em dash (U+2014) is not allowed in RD/SD (nexa-rd-writer rule)');
    known.add(id);
    docs.push({ file, id, isSd, text, fm });
  }

  for (const { file, isSd, text, fm } of docs) {
    const rules = isSd ? SD_GATE : RD_GATE;
    for (const [rule, re] of rules) if (!re.test(text)) err(file, `${isSd ? 'G1_5' : 'G1'} ${rule} not satisfied`);
    if (isSd && words(text) <= 150) err(file, 'G1_5 sd.specificity: needs more than 150 words');
    if (!isSd && words(text) <= 200) err(file, 'G1 rd.specificity: needs more than 200 words');
    if (isSd && SD_FORBIDDEN.test(text)) err(file, 'detailed-design content (SQL / logic block) belongs in 03-dd');
    const deps = (fm?.depends_on ?? '').replace(/[[\]]/g, '').split(',').map((s) => s.trim()).filter(Boolean);
    for (const d of deps) if (!known.has(d)) err(file, `depends_on ${d} does not exist`);
    if (!isSd) {
      const reqs = [...new Set([...text.matchAll(/^### (REQ-\d{3})\b/gm)].map((x) => x[1]))];
      const matrix = text.split(/^## \d+\. Traceability Matrix/m)[1] ?? '';
      if (reqs.length && !matrix) err(file, 'missing "## N. Traceability Matrix" section');
      for (const r of reqs) if (matrix && !new RegExp(`^\\| ${r} \\|`, 'm').test(matrix)) err(file, `${r} missing from Traceability Matrix`);
    }
  }

  const index = join(root, 'docs/01-sd/SD-INDEX.md');
  if (sdFiles.length) {
    if (!existsSync(index)) errors.push('docs/01-sd/SD-INDEX.md: missing');
    else {
      const idx = readFileSync(index, 'utf8');
      for (const { id, isSd } of docs) if (isSd && !idx.includes(id)) errors.push(`docs/01-sd/SD-INDEX.md: ${id} not listed`);
    }
  }
  return { errors, checked: docs.length };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const root = process.argv[2] ?? process.cwd();
  const { errors, checked } = checkDocs(root);
  for (const e of errors) console.error(`FAIL ${e}`);
  console.log(`check-docs: ${checked} RD/SD docs, ${errors.length} error(s)`);
  process.exit(errors.length ? 1 : 0);
}
