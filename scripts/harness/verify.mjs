#!/usr/bin/env node
// NEXA harness starter: the local gate. One line per check; the last two lines are the deploy ladder.
// Checks come from harness.config.mjs; agents-md and hygiene are built in.
// Usage: node scripts/harness/verify.mjs [--full] [--base=<ref>] [--<option>=<value> for each name in CONFIG.options]
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, sep } from 'node:path';
import { CONFIG, ROOT, changedFiles, deployLadder, diffHash, git, headSha, writeLastVerify } from './lib.mjs';

const STATUSES = ['PASS', 'FAIL', 'INVALID', 'NOT_TESTED', 'BLOCKED_INPUT', 'PENDING_AUTH', 'WAIVED'];
const argv = process.argv.slice(2).filter((a) => a !== '--'); // pnpm passes `--` through to the script
const optionRe = new RegExp(`^--(base${CONFIG.options.map((o) => `|${o}`).join('')})=.`);
const bad = argv.filter((a) => a !== '--full' && !optionRe.test(a));
if (bad.length) {
  console.error(`không hiểu: ${bad.join(' ')}\ndùng: ${CONFIG.verifyCommand} -- [--full] [--base=<ref>]${CONFIG.options.map((o) => ` [--${o}=<giá trị>]`).join('')}`);
  process.exit(2);
}
const values = (name) => [...new Set(argv.filter((a) => a.startsWith(`--${name}=`)).flatMap((a) => a.slice(name.length + 3).split(',')).filter(Boolean))];
const base = values('base').at(-1) || CONFIG.base;
// Every --x flag counts (--x=a --x=b and --x=a,b): a requested target must never be dropped silently.
const opts = Object.fromEntries(CONFIG.options.map((o) => [o, values(o)]));
let full = argv.includes('--full');

const sha = headSha();
const snapshot = () => ({ status: git(['status', '--porcelain', '-uall'], { allowFail: true }), hash: diffHash() });
const before = snapshot();
const { files, baseOk } = changedFiles({ base });
if (!baseOk && !full) { full = true; console.log(`! không tìm được merge-base với ${base} (clone nông hoặc thiếu remote) → chạy như --full`); }
const mode = full ? 'full' : 'quick';
const logRoot = join(tmpdir(), `${CONFIG.stateName}-logs`);
mkdirSync(logRoot, { recursive: true });
const logDir = mkdtempSync(join(logRoot, `${new Date().toISOString().replace(/\D/g, '').slice(0, 14)}-${sha.slice(0, 7) || 'nohead'}-`));
console.log(`verify ${mode} · base ${base} · ${files.length} file đổi · log: ${logDir}`);

const posix = (p) => relative(ROOT, p).split(sep).join('/');
const live = files.filter((f) => existsSync(join(ROOT, f)));

function exec(name, cmd, args, cwd = ROOT) {
  return new Promise((done) => {
    const shell = process.platform === 'win32' && cmd !== process.execPath; // npm/npx are .cmd shims on Windows
    const child = spawn(cmd, shell ? args.map((a) => (/\s/.test(a) ? `"${a}"` : a)) : args, { cwd, shell, timeout: 20 * 60e3 });
    let out = '';
    let settled = false;
    const finish = (code) => { if (settled) return; settled = true; writeFileSync(join(logDir, `${name}.log`), out); done({ code, out }); };
    child.stdout.on('data', (d) => { out += d; });
    child.stderr.on('data', (d) => { out += d; });
    child.on('error', (error) => { out += `\n${error.message}\n`; finish(127); });
    child.on('close', (code, signal) => finish(signal ? `${signal}` : code));
  });
}
const shown = (cmd, args, cwd) => `${cwd !== ROOT ? `(${posix(cwd)}) ` : ''}${cmd === process.execPath ? 'node' : cmd} ${args.join(' ')}`;
async function step(name, cmd, args, cwd = ROOT, label = shown(cmd, args, cwd)) {
  const { code, out } = await exec(name, cmd, args, cwd);
  return { status: code === 0 ? 'PASS' : 'FAIL', cmd: label, out, note: code === 0 ? '' : `exit ${code}` };
}
const skip = (note) => ({ status: 'NOT_TESTED', note });
// What every check sees. `step` runs a command and logs it; `skip` is a NOT_TESTED with its reason.
const ctx = { ROOT, CONFIG, files, live, full, base, opts, logDir, sha, step, skip, node: process.execPath };

function agentsMd() {
  const { path, maxLines, forbid } = CONFIG.agentsMd;
  if (!existsSync(join(ROOT, path))) return skip(`chưa có ${path}`);
  const text = readFileSync(join(ROOT, path), 'utf8');
  const count = text.replace(/\n$/, '').split('\n').length;
  const hits = forbid.map(({ pattern, why }) => { const m = text.match(pattern); return m && `chứa "${m[0]}" (${why})`; }).filter(Boolean);
  const problems = [count > maxLines && `${count} dòng > ${maxLines}`, ...hits].filter(Boolean);
  return { status: problems.length ? 'FAIL' : 'PASS', note: problems.join('; ') || `${path} ${count} dòng ≤${maxLines}` };
}

async function runCheck(check) {
  const verdict = check.when ? await check.when(ctx) : true;
  if (verdict !== true) return skip(typeof verdict === 'string' ? verdict : 'diff không chạm phần này');
  if (Array.isArray(check.run)) return step(check.id, check.run[0], check.run.slice(1), check.cwd ? join(ROOT, check.cwd) : ROOT);
  return check.run(ctx);
}

function hygiene() {
  const after = snapshot();
  const set = (s) => new Set(s.split('\n').filter(Boolean));
  const [b, a] = [set(before.status), set(after.status)];
  const changed = [...[...a].filter((l) => !b.has(l)).map((l) => `+${l}`), ...[...b].filter((l) => !a.has(l)).map((l) => `-${l}`)];
  if (!changed.length && after.hash === before.hash) return { status: 'PASS', note: 'git status và nội dung cây không đổi trong lúc chạy' };
  return { status: 'FAIL', note: `một phép kiểm (hoặc ai đó) đã ghi vào repo trong lúc chạy: ${changed.slice(0, 6).join(', ') || 'nội dung file đã đổi'}` };
}

async function timed(id, fn) {
  const started = Date.now();
  let rs;
  try { rs = [await fn()].flat(); } catch (error) { rs = [{ status: 'FAIL', note: `lỗi trong verify: ${error.message}` }]; }
  const secs = Math.round((Date.now() - started) / 100) / 10;
  return rs.map((r) => {
    const status = STATUSES.includes(r.status) ? r.status : 'INVALID';
    const note = status === r.status ? r.note || '' : `trạng thái không hợp lệ "${r.status}" · ${r.note || ''}`;
    return { id: r.id || id, status, secs, cmd: r.cmd || '', note, out: r.out, extra: r.extra };
  });
}

// Checks run one after another; a check with parallel: true starts at once (long suites such as server tests).
const jobs = [['agents-md', timed('agents-md', agentsMd)]];
let chain = jobs[0][1];
for (const check of CONFIG.checks) {
  const run = () => timed(check.id, () => runCheck(check));
  if (check.parallel) jobs.push([check.id, run()]);
  else { chain = chain.then(run); jobs.push([check.id, chain]); }
}
const results = [];
const print = (r) => {
  const text = [r.cmd, r.note].filter(Boolean).join(' · ');
  console.log(`${r.status.padEnd(11)} ${r.id.padEnd(13)} ${r.secs.toFixed(1).padStart(5)}s  ${text.length > 240 ? `${text.slice(0, 239)}…` : text}`);
  for (const line of r.extra || []) console.log(`    ${line}`);
  if ((r.status === 'FAIL' || r.status === 'INVALID') && r.out) for (const line of r.out.trimEnd().split('\n').slice(-30)) console.log(`    │ ${line}`);
};
for (const [, job] of jobs) for (const r of await job) { results.push(r); print(r); }
const [h] = await timed('hygiene', hygiene);
results.push(h);
print(h);

const exit = results.some((r) => r.status === 'FAIL' || r.status === 'INVALID') ? 1 : 0;
writeLastVerify({ sha, diff_hash: before.hash, mode, exit, at: new Date().toISOString(), base, logs: logDir, results: results.map(({ id, status, secs, cmd, note }) => ({ id, status, secs, cmd, note })) });
console.log(`sha=${sha.slice(0, 7)} diff=${before.hash.slice(0, 6)} mode=${mode} exit=${exit} · log: ${logDir}`);
for (const line of deployLadder()) console.log(line);
process.exitCode = exit;
