// NEXA harness starter: shared helpers for verify + Claude hooks. Zero dependencies, ESM, Node >= 18.
// Project settings live in harness.config.mjs next to this file; this file stays the same in every project.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const ROOT = resolve(HERE, '../..');
export const UNKNOWN = 'không rõ';

const DEFAULTS = {
  project: basename(ROOT),
  base: 'origin/main',
  prodBranches: ['main'],
  stateName: 'nexa-verify',
  verifyCommand: 'npm run verify',
  agentsMd: { path: 'AGENTS.md', maxLines: 150, forbid: [] },
  options: [],
  checks: [],
  protectedPaths: [],
  blockedCommands: [],
  preBash: [],
  postEdit: [],
  codePaths: /^(src|server|lib|app|web\/src|packages|tests?|scripts)\//,
  deploy: { migrationsDir: null, migrationsMatch: /\.sql$/, lockfiles: [], releaseTags: null, finalRung: 'deploy: CHƯA XÁC NHẬN (chỉ chủ sản phẩm xác nhận)' },
  sessionNotes: [],
};

const configFile = join(HERE, 'harness.config.mjs');
const loaded = existsSync(configFile) ? (await import(pathToFileURL(configFile).href)).default || {} : {};
export const CONFIG = {
  ...DEFAULTS,
  ...loaded,
  agentsMd: { ...DEFAULTS.agentsMd, ...(loaded.agentsMd || {}) },
  deploy: { ...DEFAULTS.deploy, ...(loaded.deploy || {}) },
};
if (!Array.isArray(CONFIG.prodBranches) || !CONFIG.prodBranches.length) throw new Error('harness.config.mjs: prodBranches phải là mảng có ít nhất 1 nhánh');
export const PROD = CONFIG.prodBranches;

export function git(args, { allowFail = false } = {}) {
  try {
    // quotePath=false keeps non-ASCII file names readable instead of octal-escaped.
    return execFileSync('git', ['-c', 'core.quotePath=false', ...args], {
      cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 512 * 1024 * 1024,
    }).trim();
  } catch (error) {
    if (allowFail) return '';
    throw error;
  }
}

export const lines = (text) => text.split('\n').filter(Boolean);
export const hasRef = (ref) => Boolean(git(['rev-parse', '--verify', '--quiet', `${ref}^{commit}`], { allowFail: true }));
const short = (ref) => git(['rev-parse', '--short', ref], { allowFail: true }) || UNKNOWN;
// Commits reachable from `from` but not from `to`, or null when either ref is missing.
const countBetween = (to, from) => {
  const out = git(['rev-list', '--count', `${to}..${from}`], { allowFail: true });
  return out === '' ? null : Number(out);
};
const untracked = () => lines(git(['ls-files', '--others', '--exclude-standard'], { allowFail: true })).sort();

export const headSha = () => git(['rev-parse', 'HEAD'], { allowFail: true });

export function changedFiles({ base = CONFIG.base } = {}) {
  const mergeBase = git(['merge-base', 'HEAD', base], { allowFail: true });
  // Without a merge-base (shallow clone, missing remote) only local, uncommitted changes are known.
  const tracked = git(['diff', '--name-only', '--no-renames', mergeBase || 'HEAD'], { allowFail: true });
  const files = [...new Set([...lines(tracked), ...untracked()])].sort();
  return { files, baseOk: Boolean(mergeBase) };
}

// sha256 of the uncommitted state; a clean tree hashes to CLEAN_HASH (sha256 of nothing).
export const CLEAN_HASH = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
export function diffHash() {
  const hash = createHash('sha256').update(git(['diff', 'HEAD', '--binary'], { allowFail: true }));
  // Untracked contents count too, so editing a new file after a verify run changes the hash.
  for (const file of untracked()) {
    hash.update(`\0${file}\0`);
    try { hash.update(readFileSync(join(ROOT, file))); } catch { /* removed meanwhile or unreadable */ }
  }
  return hash.digest('hex');
}

// Verify state lives inside .git, never in the tracked tree.
export function stateDir() {
  const dir = resolve(ROOT, git(['rev-parse', '--git-path', CONFIG.stateName], { allowFail: true }) || join('.git', CONFIG.stateName));
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function readLastVerify() {
  try { return JSON.parse(readFileSync(join(stateDir(), 'last.json'), 'utf8')); } catch { return null; }
}

export function writeLastVerify(obj) {
  writeFileSync(join(stateDir(), 'last.json'), `${JSON.stringify(obj, null, 2)}\n`);
}

// Problems that keep `last` from proving a clean-tree `verify --full` exit 0 at `sha`; [] when it does.
export const verifyProblems = (last, sha, what) => (!last ? ['chưa có lần verify nào'] : [
  last.mode !== 'full' && `mode=${last.mode} (cần full)`,
  last.exit !== 0 && `exit=${last.exit} (cần 0)`,
  last.sha !== sha && `sha=${String(last.sha || '?').slice(0, 7)} ≠ ${what} ${String(sha || '?').slice(0, 7)}`,
  last.diff_hash !== CLEAN_HASH && 'lúc chạy cây có thay đổi chưa commit',
].filter(Boolean));

// Deploy ladder: where HEAD sits on the way to prod. Every prod candidate is shown; only the owner confirms deploy.
export function deployLadder() {
  const branch = git(['rev-parse', '--abbrev-ref', 'HEAD'], { allowFail: true }) || UNKNOWN;
  const dirty = git(['status', '--porcelain'], { allowFail: true }) ? ' (+ thay đổi chưa commit)' : '';
  const behindHead = (ref) => {
    const n = countBetween(ref, 'HEAD');
    return n === null ? UNKNOWN : n === 0 ? 'đã chứa HEAD' : `${n} commit sau HEAD, chưa chứa HEAD`;
  };
  const first = `origin/${PROD[0]}`;
  let pr = hasRef(first) ? 'chưa push nhánh lên origin' : `${UNKNOWN} (thiếu ref origin)`;
  if (branch === 'HEAD') pr = `${UNKNOWN} (detached HEAD)`;
  else if (hasRef(`origin/${branch}`)) {
    const unpushed = countBetween(`origin/${branch}`, 'HEAD');
    pr = `${UNKNOWN} (origin/${branch} @${short(`origin/${branch}`)}${unpushed ? `, ${unpushed} commit chưa push` : ', đã push HEAD'})`;
  }
  const rungs = PROD.map((b, i) => {
    const ref = `origin/${b}`;
    if (!hasRef(ref)) return `${b} @${UNKNOWN}`;
    if (i === 0 || !hasRef(first)) return `${b} @${short(ref)} (${behindHead(ref)})`;
    const behind = countBetween(ref, first);
    const ahead = countBetween(first, ref);
    const vs = !behind && !ahead ? `trùng ${PROD[0]}` : [behind && `chậm ${behind} commit sau ${PROD[0]}`, ahead && `có ${ahead} commit không có trên ${PROD[0]}`].filter(Boolean).join(', ');
    return `${b} @${short(ref)} (${vs}; ${behindHead(ref)})`;
  });
  // A product shipped as tagged releases (packages, apps) gets one more rung: the newest matching tag.
  const { releaseTags, finalRung } = CONFIG.deploy;
  if (releaseTags) {
    const tag = lines(git(['tag', '--list', releaseTags, '--sort=-v:refname'], { allowFail: true }))[0];
    rungs.push(tag ? `release ${tag} @${short(`${tag}^{commit}`)} (${behindHead(`${tag}^{commit}`)})` : `release ${UNKNOWN} (chưa có tag ${releaseTags}; git fetch --tags)`);
  }
  const ladder = `THANG: nhánh ${branch === 'HEAD' ? '(detached)' : branch} @${short('HEAD')}${dirty} → PR: ${pr} → ${rungs.join(' → ')} → ${finalRung}`;
  return [ladder, deployLine()];
}

// Prod may run any candidate at any older sha, so "new" means: in this tree or on the first prod branch (what will
// ship) but missing on that candidate.
function deployLine() {
  const { migrationsDir, migrationsMatch, lockfiles } = CONFIG.deploy;
  const refs = PROD.map((b) => `origin/${b}`);
  const known = refs.filter(hasRef);
  const parts = [];
  if (migrationsDir) {
    const on = (ref) => new Set(lines(git(['ls-tree', '--name-only', ref, `${migrationsDir}/`], { allowFail: true })).map((p) => p.split('/').pop()).filter((f) => migrationsMatch.test(f)));
    const dir = join(ROOT, migrationsDir);
    const upcoming = new Set(existsSync(dir) ? readdirSync(dir).filter((f) => migrationsMatch.test(f)) : []);
    if (hasRef(refs[0])) for (const f of on(refs[0])) upcoming.add(f);
    const rows = refs.map((ref) => ({ ref, missing: known.includes(ref) ? [...upcoming].filter((f) => !on(ref).has(f)).sort() : null }));
    const list = (r) => (r.missing === null ? UNKNOWN : r.missing.length ? r.missing.join(', ') : 'không');
    const backup = rows.some((r) => r.missing?.length) ? 'có' : rows.some((r) => r.missing === null) ? UNKNOWN : 'không';
    parts.push(`migration mới ${rows.map((r) => `so với ${r.ref}: ${list(r)}`).join('; ')}`, `cần backup DB: ${backup}`);
  }
  for (const lock of lockfiles) {
    const differs = (ref) => Boolean(git(['diff', '--name-only', ref, '--', lock], { allowFail: true })
      || (ref !== refs[0] && hasRef(refs[0]) && git(['diff', '--name-only', ref, refs[0], '--', lock], { allowFail: true })));
    const hits = known.filter(differs);
    parts.push(`${lock} đổi: ${hits.length ? `có (so với ${hits.join(', ')})` : known.length < refs.length ? UNKNOWN : 'không'}`);
  }
  if (!parts.length) parts.push('không khai báo migration hay lockfile (harness.config.mjs → deploy)');
  return `DEPLOY: ${parts.join(' · ')}`;
}
