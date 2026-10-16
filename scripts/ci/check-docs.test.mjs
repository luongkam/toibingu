import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { after, test } from 'node:test';
// The checker is the NEXA starter copy (scripts/harness/check-docs.mjs); these cases lock Toibingu's settings for it
// (`docs` in scripts/harness/harness.config.mjs): G1/G1_5, ids, folders, domain, frontmatter, depends_on, REQ trace.
import { checkDocs as nexaCheckDocs } from '../harness/check-docs.mjs';
import config from '../harness/harness.config.mjs';

const checkDocs = (root) => {
  const r = nexaCheckDocs(join(root, config.docs.root), config.docs);
  return { errors: r.problems.map((p) => `${p.file}: ${p.rule} ${p.message}`), checked: r.rd + r.sd };
};

const roots = [];
after(() => roots.forEach((r) => rmSync(r, { recursive: true, force: true })));

const filler = (n) => Array.from({ length: n }, (_, i) => `word${i}`).join(' ');
const RD = `---\ndoc_id: RD-TBT001\n---\n# RD\n## 1. Business Overview\nmodule x\n### REQ-001 A\n## 3. Scope\n## 4. Out of scope\n## 7. Open questions\n## 8. Customer confirmation\n## 10. Traceability Matrix\n| REQ | x |\n|---|---|\n| REQ-001 | y |\n${filler(210)}\n`;
const SD = (id, extra = '') => `---\ndoc_id: ${id}\ndepends_on: [RD-TBT001]\n---\n# ${id}\n## 1. Purpose\n## 2. Scope\n## 3. Design decisions\nRD-TBT001 NFR\n${extra}${filler(160)}\n`;

function repo(files) {
  const root = mkdtempSync(join(tmpdir(), 'toibingu-docs-'));
  roots.push(root);
  const all = {
    '.nexa/domain-registry.json': JSON.stringify({ domains: [{ code: 'TB' }] }),
    'docs/01-rd/RD-REQ/RD-TBT001-customer-requirements.md': RD,
    'docs/01-sd/architecture/SD-TBH001-architecture.md': SD('SD-TBH001'),
    'docs/01-sd/SD-INDEX.md': '| SD-TBH001 |',
    ...files,
  };
  for (const [p, body] of Object.entries(all)) {
    if (body === null) continue;
    mkdirSync(dirname(join(root, p)), { recursive: true });
    writeFileSync(join(root, p), body);
  }
  return checkDocs(root);
}

test('a conforming RD + SD set passes', () => {
  assert.deepEqual(repo({}), { errors: [], checked: 2 });
});

test('SD type letter must match its 01-sd subfolder', () => {
  const r = repo({ 'docs/01-sd/nfr/SD-TBH002-x.md': SD('SD-TBH002'), 'docs/01-sd/SD-INDEX.md': 'SD-TBH001 SD-TBH002' });
  assert.match(r.errors.join('\n'), /SD-TBH002-x\.md: sd\.folder loại H nằm ở 01-sd\/architecture/);
});

test('unregistered domain, wrong doc_id and unlisted SD are caught', () => {
  const r = repo({ 'docs/01-sd/nfr/SD-ZZN001-x.md': SD('SD-ZZN999') });
  const out = r.errors.join('\n');
  assert.match(out, /doc\.domain domain ZZ chưa có trong \.nexa\/domain-registry\.json/);
  assert.match(out, /doc\.frontmatterId frontmatter doc_id "SD-ZZN999" khác id tên file "SD-ZZN001"/);
  assert.match(out, /sd\.index SD-ZZN001 chưa có trong SD-INDEX\.md/);
});

test('SD without an RD trace fails G1_5', () => {
  const r = repo({ 'docs/01-sd/architecture/SD-TBH001-architecture.md': SD('SD-TBH001').replace('RD-TBT001 NFR', 'NFR').replace('depends_on: [RD-TBT001]\n', '') });
  assert.match(r.errors.join('\n'), /G1_5 sd\.traceRd/);
});

test('SQL in SD is rejected as detailed design', () => {
  const r = repo({ 'docs/01-sd/architecture/SD-TBH001-architecture.md': SD('SD-TBH001', 'CREATE TABLE story (id int);\n') });
  assert.match(r.errors.join('\n'), /project SQL \/ logic block là detailed design, thuộc 03-dd/);
});

test('a REQ missing from the traceability matrix fails', () => {
  const r = repo({ 'docs/01-rd/RD-REQ/RD-TBT001-customer-requirements.md': RD.replace('## 3. Scope', '### REQ-002 B\n## 3. Scope') });
  assert.match(r.errors.join('\n'), /project REQ-002 chưa có trong Traceability Matrix/);
});

test('em dash is rejected and depends_on must exist', () => {
  const r = repo({ 'docs/01-sd/architecture/SD-TBH001-architecture.md': SD('SD-TBH001', 'a — b\n').replace('[RD-TBT001]', '[RD-TBT001, SD-TBX009]') });
  const out = r.errors.join('\n');
  assert.match(out, /doc\.noEmDash dòng \d+ có em dash/);
  assert.match(out, /doc\.dependsOn depends_on SD-TBX009 không có tài liệu/);
});

test('an RD file without frontmatter and an unknown status fail', () => {
  const r = repo({ 'docs/01-rd/RD-REQ/RD-TBT001-customer-requirements.md': RD.replace('---\ndoc_id: RD-TBT001\n---\n', ''),
    'docs/01-sd/architecture/SD-TBH001-architecture.md': SD('SD-TBH001').replace('depends_on:', 'status: draft\ndepends_on:') });
  const out = r.errors.join('\n');
  assert.match(out, /RD-TBT001-customer-requirements\.md: doc\.frontmatter/);
  assert.match(out, /doc\.status status "draft"/);
});
