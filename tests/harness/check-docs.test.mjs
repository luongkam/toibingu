// NEXA harness self-test for scripts/harness/check-docs.mjs (RD/SD doc checker). Copy next to harness.test.mjs and
// run with `node --test <this file>`. It builds a throwaway docs tree, so it never reads or writes the project's docs.
// The samples carry full NEXA frontmatter (doc_id, status, depends_on) so the CLI case also passes under a strict
// project `docs` config (requireFrontmatter, checkDependsOn).
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { after, before, test } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

function findRoot(start) {
  for (let dir = start; ; dir = dirname(dir)) {
    if (existsSync(join(dir, 'scripts/harness/check-docs.mjs'))) return dir;
    if (dirname(dir) === dir) throw new Error('scripts/harness/check-docs.mjs not found above this test');
  }
}
const ROOT = process.env.HARNESS_ROOT ? resolve(process.env.HARNESS_ROOT) : findRoot(dirname(fileURLToPath(import.meta.url)));
const CHECKER = join(ROOT, 'scripts/harness/check-docs.mjs');
const { checkDocs, parseDocId } = await import(pathToFileURL(CHECKER).href);
const EM = String.fromCharCode(0x2014);

const SD = `---
doc_id: SD-ACMH001
status: AI_GENERATED
depends_on: [RD-ACMT001]
---
# SD-ACMH001 方式設計 / Architecture
## 1. システム概要 / Purpose
The order portal is one modular web application; this SD fixes its structure for BD.
## 2. システム境界 / System boundary (Scope)
Order entry and status inquiry; invoicing stays in the core ERP.
## 3. 設計方針 / Design decisions
Modular monolith, one database, a queue for the ERP integration (連携), traced to RD-ACMT001.
${Array.from({ length: 160 }, (_, i) => `detail${i}`).join(' ')}
`;
const RD = `---
doc_id: RD-ACMT001
status: INTERNAL_REVIEW
---
# RD-ACMT001 Orders
## 1. Business Overview
Dealers send orders. The order module keeps them. source: 00-intake/knowledge/hearing.md
## 2. Scope
Order entry. Out of scope: invoices. Open questions: none. Customer confirmation: approver.
${Array.from({ length: 210 }, (_, i) => `detail${i}`).join(' ')}
`;

let docs;
const put = (rel, text) => { mkdirSync(dirname(join(docs, rel)), { recursive: true }); writeFileSync(join(docs, rel), text); };
const cli = () => spawnSync(process.execPath, [CHECKER, docs], { encoding: 'utf8' });
before(() => {
  docs = mkdtempSync(join(tmpdir(), 'nexa-check-docs-'));
  put('01-rd/RD-ACMT001-orders.md', RD);
  put('01-sd/architecture/SD-ACMH001-architecture.md', SD);
  put('01-sd/SD-INDEX.md', '| Id | Title | Status | Depends on |\n|---|---|---|---|\n| SD-ACMH001 | Architecture | draft | RD-ACMT001 |\n');
});
after(() => rmSync(docs, { recursive: true, force: true }));

test('doc ids: SD takes X/H/N/I/Y/P, RD/BD/DD take T/S/A/B/R/E/C', () => {
  assert.equal(parseDocId('SD-ACMH001').type, 'H');
  assert.equal(parseDocId('SD-ACMT001'), null);
  assert.equal(parseDocId('RD-ACMX001'), null);
});

test('a well-formed RD + SD tree passes (G1, G1_5, folder, SD-INDEX)', () => {
  const r = checkDocs(docs);
  assert.deepEqual(r.problems, []);
  assert.equal(cli().status, 0);
});

test('em dash, wrong folder and 02-bd/system-design fail; the CLI exits 1', () => {
  put('01-sd/nfr/SD-ACMH002-x.md', SD.replace('SD-ACMH001', 'SD-ACMH002').replace('Purpose', `Purpose ${EM} x`));
  put('02-bd/system-design/old.md', '# old\n');
  const rules = checkDocs(docs).problems.map((p) => `${p.file} ${p.rule}`);
  for (const want of ['01-sd/nfr/SD-ACMH002-x.md doc.noEmDash', '01-sd/nfr/SD-ACMH002-x.md sd.folder', '01-sd/nfr/SD-ACMH002-x.md sd.index', '02-bd/system-design/old.md sd.location']) {
    assert.ok(rules.includes(want), `${want} missing from ${rules.join(', ')}`);
  }
  assert.equal(cli().status, 1);
});
