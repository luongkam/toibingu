// NEXA harness self-test (layer L5). Copy into the project's test folder and run with `node --test <this file>`.
// It drives the real scripts/harness/{verify,hooks}.mjs inside a throwaway git repo with a bare origin, using the
// project's own harness.config.mjs (verify checks emptied, so the run takes seconds). Add one case per project rule.
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { after, before, test } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

function findRoot(start) {
  for (let dir = start; ; dir = dirname(dir)) {
    if (existsSync(join(dir, 'scripts/harness/hooks.mjs'))) return dir;
    if (dirname(dir) === dir) throw new Error('scripts/harness/hooks.mjs not found above this test');
  }
}
const SRC = join(process.env.HARNESS_ROOT ? resolve(process.env.HARNESS_ROOT) : findRoot(dirname(fileURLToPath(import.meta.url))), 'scripts/harness');
const realConfig = join(SRC, 'harness.config.mjs');
const config = existsSync(realConfig) ? (await import(pathToFileURL(realConfig).href)).default : {};
const PROD = config.prodBranches || ['main'];
// A file the Stop reminder counts as code under this project's codePaths (the starter default covers src/).
const CODE_FILE = ['src', 'server', 'lib', 'app', 'packages', 'scripts', 'tests'].map((d) => `${d}/harness-probe.txt`)
  .find((f) => (config.codePaths || /^src\//).test(f)) || 'src/harness-probe.txt';

let tmp;
let work;
const git = (...args) => execFileSync('git', args, { cwd: work, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const hook = (mode, input) => spawnSync(process.execPath, [join(work, 'scripts/harness/hooks.mjs'), mode], { cwd: work, input: JSON.stringify(input), encoding: 'utf8' });
const verify = (...args) => spawnSync(process.execPath, [join(work, 'scripts/harness/verify.mjs'), ...args], { cwd: work, encoding: 'utf8' });
const bash = (command) => hook('pre-bash', { tool_input: { command }, cwd: work });
const commit = (file, text) => { mkdirSync(dirname(join(work, file)), { recursive: true }); writeFileSync(join(work, file), text); git('add', '-A'); git('commit', '-qm', file); };

before(() => {
  tmp = mkdtempSync(join(tmpdir(), 'nexa-harness-test-'));
  work = join(tmp, 'work');
  execFileSync('git', ['init', '-q', '--bare', join(tmp, 'origin.git')]);
  mkdirSync(work);
  git('init', '-q', '-b', PROD[0]);
  git('config', 'user.email', 'harness@test');
  git('config', 'user.name', 'harness');
  git('config', 'commit.gpgsign', 'false');
  mkdirSync(join(work, 'scripts/harness'), { recursive: true });
  for (const f of ['lib.mjs', 'verify.mjs', 'hooks.mjs']) cpSync(join(SRC, f), join(work, 'scripts/harness', f));
  const base = existsSync(realConfig) ? `import real from ${JSON.stringify(pathToFileURL(realConfig).href)};\n` : 'const real = {};\n';
  // One probe rule, written the plain way (w[0] is the program), proves package runners are unwrapped before match().
  // It goes first so a project rule for the same command (a real deploy guard) cannot answer before it.
  const probe = "{ label: 'probe deploy', match: (w) => w[0] === 'vercel' && w.includes('--prod'), message: 'probe: deploy prod' }";
  writeFileSync(join(work, 'scripts/harness/harness.config.mjs'), `${base}export default { ...real, base: 'origin/${PROD[0]}', checks: [], blockedCommands: [${probe}, ...(real.blockedCommands || [])] };\n`);
  commit('README.md', 'harness test\n');
  git('remote', 'add', 'origin', join(tmp, 'origin.git'));
  for (const b of PROD) git('push', '-q', 'origin', `HEAD:refs/heads/${b}`);
  git('fetch', '-q', 'origin');
  git('checkout', '-qb', 'feat/x');
  commit('src/a.txt', 'one\n');
});
after(() => rmSync(tmp, { recursive: true, force: true }));

test('push onto a prod branch is blocked until verify --full passes on a clean tree at that sha', () => {
  let r = bash(`git push origin HEAD:${PROD[0]}`);
  assert.equal(r.status, 2, r.stderr);
  writeFileSync(join(work, 'dirty.txt'), 'wip\n');
  assert.equal(verify('--full').status, 0);
  r = bash(`git push origin HEAD:${PROD[0]}`);
  assert.equal(r.status, 2, 'a verify run on a dirty tree must not open the gate');
  assert.match(r.stderr, /chưa commit/);
  rmSync(join(work, 'dirty.txt'));
  const v = verify('--full');
  assert.equal(v.status, 0, v.stdout);
  assert.match(v.stdout, /^sha=\w{7} diff=e3b0c4 mode=full exit=0/m);
  assert.match(v.stdout, /^THANG: /m);
  assert.match(v.stdout, /^DEPLOY: /m);
  assert.equal(bash(`git push origin HEAD:${PROD[0]}`).status, 0);
  commit('src/a.txt', 'two\n');
  assert.equal(bash(`cd ${work} && git push origin HEAD:${PROD[0]}`).status, 2, 'a new commit needs a new run');
});

test('force-push or delete of every prod branch is blocked; feature branches and quoted text are not', () => {
  for (const b of PROD) {
    assert.equal(bash(`git push -f origin ${b}`).status, 2);
    assert.equal(bash(`git push origin :${b}`).status, 2);
    assert.equal(bash(`env X=1 git push --force-with-lease origin HEAD:${b}`).status, 2);
  }
  assert.equal(bash('git push -u origin feat/x').status, 0);
  assert.equal(bash(`git commit -m "do not git push -f origin ${PROD[0]}"`).status, 0);
});

test('blockedCommands see the program behind env, sudo and package runners', () => {
  for (const cmd of ['vercel --prod', 'npx vercel --prod', 'npx -y vercel --prod', 'npx --yes vercel@latest --prod', 'npx -p vercel vercel --prod',
    'pnpm dlx vercel --prod', 'pnpm exec vercel --prod', 'yarn dlx vercel --prod', 'bunx vercel --prod', 'env CI=1 npx -y vercel --prod', 'bash -c "pnpm dlx vercel --prod"']) {
    const r = bash(cmd);
    assert.equal(r.status, 2, `${cmd} must be blocked: ${r.stderr}`);
    assert.match(r.stderr, /probe: deploy prod/);
  }
  for (const cmd of ['npx vercel --help', 'pnpm dlx vercel', 'pnpm install vercel', 'echo "npx vercel --prod"']) assert.equal(bash(cmd).status, 0, cmd);
});

test('merge gate fails closed', () => {
  assert.equal(hook('pre-merge', { tool_name: 'mcp__github__merge_pull_request', tool_input: {} }).status, 2);
  const r = hook('pre-merge', { tool_name: 'mcp__github__push_files', tool_input: { branch: PROD[0] } });
  assert.equal(r.status, 2, r.stderr);
  assert.equal(hook('pre-merge', { tool_name: 'mcp__github__push_files', tool_input: { branch: 'feat/x' } }).status, 0);
});

test('a broken lib.mjs blocks pushes instead of waving them through', () => {
  const lib = join(work, 'scripts/harness/lib.mjs');
  cpSync(lib, `${lib}.bak`);
  try {
    writeFileSync(lib, 'export const = ;\n');
    assert.equal(bash('git push origin feat/x').status, 2);
    assert.equal(bash('ls').status, 1, 'unrelated commands are not blocked, only reported');
  } finally { cpSync(`${lib}.bak`, lib); rmSync(`${lib}.bak`); }
});

test('Stop reminds once per tree state when code changed without verify', () => {
  const transcript = join(tmp, 'transcript.jsonl');
  writeFileSync(transcript, [
    { type: 'user', message: { content: 'sửa giúp' } },
    { type: 'assistant', message: { content: [{ type: 'tool_use', name: 'Edit', input: { file_path: join(work, CODE_FILE) } }, { type: 'text', text: 'xong' }] } },
  ].map((e) => JSON.stringify(e)).join('\n'));
  mkdirSync(dirname(join(work, CODE_FILE)), { recursive: true });
  writeFileSync(join(work, CODE_FILE), 'three\n');
  const first = hook('stop', { transcript_path: transcript, cwd: work });
  assert.equal(first.status, 2, first.stderr);
  assert.match(first.stderr, /verify/);
  assert.equal(hook('stop', { transcript_path: transcript, cwd: work }).status, 0, 'only once for the same state');
});

// ---- Toibingu project rules (scripts/harness/harness.config.mjs) ----
const edit = (file) => hook('pre-edit', { tool_name: 'Edit', tool_input: { file_path: join(work, file) }, cwd: work });

test('toibingu: harness engine copies and pnpm-lock.yaml cannot be hand-edited; the config can', () => {
  for (const f of ['scripts/harness/lib.mjs', 'scripts/harness/verify.mjs', 'scripts/harness/hooks.mjs', 'scripts/harness/check-docs.mjs', 'pnpm-lock.yaml']) {
    const r = edit(f);
    assert.equal(r.status, 2, `${f} must be protected: ${r.stderr}`);
  }
  assert.equal(edit('scripts/harness/harness.config.mjs').status, 0);
  assert.equal(edit('packages/domain/src/ranking.ts').status, 0);
});

test('toibingu: production deploy commands are blocked, previews are not', () => {
  assert.equal(bash('vercel --prod').status, 2);
  assert.equal(bash('npx vercel deploy --prod').status, 2);
  assert.equal(bash('pnpm dlx vercel --prod').status, 2);
  // The rule is a plain w[0] match; hooks.mjs unwraps package runners (luongkam/nexa-v3-2#427).
  for (const cmd of ['npx -y vercel --prod', 'npx vercel@latest --prod', 'pnpm exec vercel --prod', 'yarn dlx vercel --prod', 'bunx vercel --prod', 'npx flyctl deploy']) {
    assert.equal(bash(cmd).status, 2, cmd);
  }
  assert.equal(bash('fly deploy').status, 2);
  assert.equal(bash('flyctl deploy --remote-only').status, 2);
  assert.equal(bash('vercel').status, 0, 'preview deploys stay allowed');
  assert.equal(bash('fly status').status, 0);
});
