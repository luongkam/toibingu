#!/usr/bin/env node
// NEXA harness starter: Claude Code hooks, wired in .claude/settings.json. Each mode reads the hook JSON on stdin.
// Exit 2 + stderr blocks a PreToolUse call, or feeds the message back to Claude (PostToolUse, Stop).
// Only Claude runs these; for people and other agents the verify command is the gate (AGENTS.md).
// Project rules come from harness.config.mjs (protectedPaths, blockedCommands, preBash, postEdit, deploy…).
// Usage: node scripts/harness/hooks.mjs session|pre-edit|pre-bash|pre-merge|post-pr|post-edit|stop
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, isAbsolute, join, relative, resolve, sep } from 'node:path';

// lib.mjs (and the project config it loads) is imported dynamically so a mid-edit syntax error there still reaches
// the fail-closed branch at the end.
let lib = {};
let loadError = null;
try { lib = await import('./lib.mjs'); } catch (error) { loadError = error; }
const { CONFIG, PROD, ROOT, changedFiles, deployLadder, diffHash, git, headSha, lines, readLastVerify, stateDir, verifyProblems } = lib;

const short = (sha) => (sha || '?').slice(0, 7);
const rel = (p) => (p ? relative(ROOT, resolve(ROOT, p)).split(sep).join('/') : '');
const branchName = () => git(['rev-parse', '--abbrev-ref', 'HEAD'], { allowFail: true });
class Block { constructor(message) { this.message = message; } }
const block = (message) => { throw new Block(message); };
const context = (event, text) => process.stdout.write(`${JSON.stringify({ hookSpecificOutput: { hookEventName: event, additionalContext: text } })}\n`);
// Network git calls get a hard timeout so a dead proxy cannot hang a hook.
const gitNet = (args, timeout) => spawnSync('git', args, { cwd: ROOT, encoding: 'utf8', timeout, stdio: ['ignore', 'pipe', 'pipe'] });
const verifyCmd = () => CONFIG.verifyCommand;

// ---- shell parsing shared by pre-bash and stop ----
const HEREDOC = /<<-?[ \t]*(['"]?)(\w+)\1([^\n]*)\n[\s\S]*?\n[ \t]*\2[ \t]*(?=\n|$)/g;
// Heredoc bodies are data, and separators inside quotes do not end a command: neither `cat <<EOF … git commit … EOF`
// nor `git commit -m "x; git push -f main"` holds a second command.
const shellCode = (cmd) => cmd.replace(HEREDOC, '<<$2$3').replace(/'[^']*'|"(?:\\.|[^"\\])*"/g, (q) => q.replace(/[;&|()\n]/g, ' '));
const segments = (cmd) => shellCode(cmd).split(/&&|\|\||[;|&\n()]/).map((s) => s.trim()).filter(Boolean);
// Words of one segment with quotes removed: `git commit -m "a b"` has 4 words, the message is one of them.
function tokens(seg) {
  const out = [];
  let cur = null;
  for (let i = 0; i < seg.length; i += 1) {
    const ch = seg[i];
    if (/\s/.test(ch)) { if (cur !== null) out.push(cur); cur = null; continue; }
    cur ??= '';
    if (ch === "'") {
      const end = seg.indexOf("'", i + 1);
      cur += seg.slice(i + 1, end < 0 ? seg.length : end);
      i = end < 0 ? seg.length : end;
    } else if (ch === '"') {
      let j = i + 1;
      for (; j < seg.length && seg[j] !== '"'; j += 1) { if (seg[j] === '\\') j += 1; cur += seg[j] ?? ''; }
      i = j;
    } else if (ch === '\\') { cur += seg[i + 1] ?? ''; i += 1; } else cur += ch;
  }
  if (cur !== null) out.push(cur);
  return out;
}
const WRAPPERS = new Set(['env', 'time', 'nice', 'nohup', 'xvfb-run', 'sudo', 'exec', 'command']);
// Drops `X=1`, `env`, `sudo`, `timeout 60` … in front of the real program.
function unwrap(words) {
  let i = 0;
  for (;;) {
    if (/^\w+=/.test(words[i] || '') || WRAPPERS.has(words[i])) i += 1;
    else if (words[i] === 'timeout') i += 2;
    else return words.slice(i);
  }
}
const expandHome = (p) => (p === '~' ? homedir() : p.startsWith('~/') ? join(homedir(), p.slice(2)) : p);
// Every simple command in a command line, with the directory it runs in (`cd x && …` moves it; null = unknown).
// `bash -c "…"` bodies count as commands too.
function calls(command, cwd) {
  const out = [];
  const walk = (cmd, start) => {
    let dir = start;
    for (const seg of segments(cmd)) {
      const words = unwrap(tokens(seg));
      if (words[0] === 'cd' || words[0] === 'pushd') {
        const to = words.slice(1).find((a) => !a.startsWith('-') || a === '-');
        dir = !to ? homedir() : to === '-' || /[$`]/.test(to) || dir === null ? null : resolve(dir, expandHome(to));
        continue;
      }
      out.push({ words, dir });
      if (/^(ba|z)?sh$/.test(basename(words[0] || '')) && /^-\w*c$/.test(words[1] || '') && words[2]) walk(words[2], dir);
    }
  };
  walk(command.replace(HEREDOC, '<<$2$3'), cwd || ROOT);
  return out;
}
const insideRoot = (dir) => {
  if (dir === null) return true; // unknown directory: assume this repo, so the gates stay on
  const r = relative(ROOT, dir);
  return !r.startsWith('..') && !isAbsolute(r);
};
// `git [-C dir] [-c k=v] [--opts] <sub> args…` → { sub, args, dir } (dir after -C), or null for another program.
function gitCall({ words, dir }) {
  if (basename(words[0] || '') !== 'git') return null;
  let i = 1;
  for (; i < words.length; i += 1) {
    const w = words[i];
    if (w === '-C') { dir = dir === null ? null : resolve(dir, expandHome(words[i + 1] || '.')); i += 1; } else if (['-c', '--git-dir', '--work-tree', '--namespace'].includes(w)) {
      if (w !== '-c') dir = dir === null ? null : resolve(dir, expandHome(words[i + 1] || '.'), w === '--git-dir' ? '..' : '.');
      i += 1;
    } else if (/^--(git-dir|work-tree)=/.test(w)) dir = dir === null ? null : resolve(dir, expandHome(w.split('=')[1]), w.startsWith('--git-dir') ? '..' : '.');
    else if (!w.startsWith('-')) break;
  }
  return { sub: words[i], args: words.slice(i + 1), dir };
}
const gitCalls = (command, sub, cwd) => calls(command, cwd).map(gitCall).filter((g) => g && g.sub === sub && insideRoot(g.dir));

// What a `git push` sends to a prod branch: [{ dst, src }] plus whether it forces (or deletes).
function prodPushes(args) {
  let force = false;
  let all = false;
  const rest = [];
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    if (a === '--force' || a.startsWith('--force-with-lease') || a === '--delete') force = true;
    else if (a === '--mirror') [force, all] = [true, true];
    else if (a === '--all' || a === '--branches') all = true;
    else if (['--repo', '--push-option', '--receive-pack', '--exec', '-o'].includes(a)) i += 1;
    else if (/^-[a-zA-Z]+$/.test(a)) force ||= /[fd]/.test(a);
    else if (!a.startsWith('-')) rest.push(a);
  }
  const refspecs = rest.slice(1); // rest[0] is the remote
  force ||= refspecs.some((r) => r.startsWith('+') || r.startsWith(':'));
  const current = branchName();
  const name = (r) => { const n = r.replace(/^refs\/heads\//, ''); return n === 'HEAD' ? current : n; };
  let pairs;
  if (refspecs.length) {
    pairs = refspecs.map((r) => {
      const [src, dst] = r.replace(/^\+/, '').split(':');
      return { src: src === '' ? '' : src, dst: name(dst ?? src) };
    });
  } else if (all) pairs = PROD.map((b) => ({ src: b, dst: b }));
  else {
    // Plain `git push`: the current branch goes to its push target (usually the same name).
    const target = git(['rev-parse', '--abbrev-ref', '@{push}'], { allowFail: true }).replace(/^[^/]+\//, '');
    pairs = current && current !== 'HEAD' ? [{ src: 'HEAD', dst: target || current }] : [];
  }
  return { force, hits: pairs.filter((p) => PROD.includes(p.dst)) };
}

// ---- session ----
function session() {
  const dirty = lines(git(['status', '--porcelain'], { allowFail: true })).length;
  const pos = (ref) => {
    const sha = git(['rev-parse', '--short', '--verify', '--quiet', `${ref}^{commit}`], { allowFail: true });
    if (!sha) return `${ref} không rõ (chưa fetch)`;
    const [behind = '?', ahead = '?'] = git(['rev-list', '--left-right', '--count', `${ref}...HEAD`], { allowFail: true }).split(/\s+/);
    return `${ref} @${sha} (HEAD hơn ${ahead}, thiếu ${behind} commit)`;
  };
  const head = headSha();
  const last = readLastVerify();
  let verify = `verify: chưa chạy lần nào trên clone này → ${verifyCmd()}`;
  if (last) {
    const state = last.sha !== head ? 'HEAD đã đổi → chạy lại' : last.diff_hash !== diffHash() ? 'cây đã đổi sau lần đó → chạy lại' : 'khớp HEAD và cây hiện tại';
    verify = `verify lần cuối: ${last.mode} exit ${last.exit} @${short(last.sha)} ${last.at || ''} · ${state}`;
  }
  const out = [
    `${CONFIG.project} · nhánh ${branchName() || 'không rõ'} @${short(head)} · ${dirty} file chưa commit`,
    `${PROD.map((b) => pos(`origin/${b}`)).join(' · ')}${PROD.length > 1 ? ' · nhánh prod chưa chốt nên theo dõi tất cả' : ''}`,
    `Cổng: ${verifyCmd()} (trước merge: ${verifyCmd()} -- --full). Merge ≠ đã lên; chỉ chủ sản phẩm xác nhận deploy.`,
    verify,
    `Hook chặn: merge PR hoặc push lên ${PROD.join('/')} khi chưa verify --full đúng sha trên cây sạch; force-push/xóa ${PROD.join('/')}; ${CONFIG.protectedPaths.length ? `sửa ${CONFIG.protectedPaths.map((p) => p.label || p.pattern).join(', ')}; ` : ''}${CONFIG.deploy.migrationsDir ? 'sửa migration đã merge hoặc migration mới không lấy số tiếp theo; ' : ''}${CONFIG.blockedCommands.length ? `lệnh: ${CONFIG.blockedCommands.map((c) => c.label).join(', ')}` : ''}`.replace(/; $/, ''),
    ...CONFIG.sessionNotes,
  ];
  process.stdout.write(`${out.join('\n')}\n`);
}

// ---- pre-edit ----
function migrationGuard(file) {
  const dirName = CONFIG.deploy.migrationsDir;
  if (!dirName || !file.startsWith(`${dirName}/`) || file.slice(dirName.length + 1).includes('/')) return;
  const name = file.slice(dirName.length + 1);
  if (!CONFIG.deploy.migrationsMatch.test(name)) return;
  const remote = Object.fromEntries(PROD.map((b) => [b, lines(git(['ls-tree', '--name-only', `origin/${b}`, `${dirName}/`], { allowFail: true })).map((p) => p.split('/').pop())]));
  const dir = join(ROOT, dirName);
  const local = existsSync(dir) ? readdirSync(dir) : [];
  const all = [...new Set([...local, ...PROD.flatMap((b) => remote[b])])].filter((f) => CONFIG.deploy.migrationsMatch.test(f));
  const num = (f) => /^(\d+)[_-]/.exec(f)?.[1];
  const max = Math.max(0, ...all.map(num).filter(Boolean).map(Number));
  const next = String(max + 1).padStart((all.map(num).find(Boolean) || '000').length, '0');
  const merged = PROD.filter((b) => remote[b].includes(name));
  if (merged.length) block(`${file} đã có trên ${merged.map((b) => `origin/${b}`).join(' và ')}: migration đã merge có thể đã chạy trên DB thật, không sửa hay đánh số lại. Thêm migration mới ${dirName}/${next}_<tên>.`);
  const mine = num(name);
  if (!mine) block(`Tên migration phải là <số>_<tên>; số tiếp theo là ${next}.`);
  const dup = all.filter((f) => f !== name && num(f) && Number(num(f)) === Number(mine));
  // This branch's own unmerged file is editable while its number is unique.
  if (dup.length) block(`${file}: số ${mine} đã có (${dup.join(', ')}); runner thường bỏ qua số đã áp dụng nên migration này sẽ không chạy. ${local.includes(name) ? 'Đổi tên file này' : 'Dùng'} ${next}_<tên>.`);
  if (local.includes(name)) return;
  if (Number(mine) !== max + 1) block(`${file}: migration mới phải lấy số tiếp theo ${next} (lớn nhất hiện có ${max}, tính cả ${PROD.map((b) => `origin/${b}`).join(', ')}).`);
}

function preEdit(tool) {
  const file = rel(tool.file_path);
  if (!file || file.startsWith('../')) return;
  for (const p of CONFIG.protectedPaths) if (p.pattern.test(file)) block(`Không sửa tay ${file}: ${p.message}`);
  migrationGuard(file);
}

// ---- pre-bash ----
function preBash(input) {
  const command = String(input.tool_input?.command || '');
  const cwd = input.cwd || ROOT;
  const all = calls(command, cwd);
  for (const rule of CONFIG.blockedCommands) {
    for (const c of all) if (rule.match(c.words, { dir: c.dir, ROOT, insideRoot: insideRoot(c.dir) })) block(rule.message);
  }
  for (const g of gitCalls(command, 'push', cwd)) {
    const { force, hits } = prodPushes(g.args);
    if (!hits.length) continue;
    const names = [...new Set(hits.map((h) => h.dst))].join(', ');
    if (force) block(`Chặn force-push/xóa nhánh ${names}: đây là nhánh prod (hoặc ứng viên prod). Mở PR từ nhánh riêng; nếu thật sự cần, chủ sản phẩm tự làm tay.`);
    for (const h of hits) {
      const sha = git(['rev-parse', '--verify', '--quiet', `${h.src}^{commit}`], { allowFail: true });
      const problems = verifyProblems(readLastVerify(), sha, `commit sẽ push (${h.src})`);
      if (problems.length) block(`Chặn push thẳng lên ${h.dst}: bỏ qua PR và cổng merge. Cần ${verifyCmd()} -- --full exit 0 trên cây sạch cho đúng commit ${sha ? short(sha) : `${h.src} (không tìm thấy ở máy này)`}.\nVerify lần cuối: ${problems.join('; ')}.\nCách đúng: push nhánh riêng, mở PR, merge qua mcp__github__merge_pull_request.`);
    }
  }
  // gh merge paths must pass the same gate as the MCP merge tool.
  for (const { words, dir } of all) {
    if (basename(words[0] || '') !== 'gh') continue;
    if (words[1] === 'pr' && words[2] === 'merge') ghPrMerge(words.slice(3), dir);
    if (words[1] === 'api') {
      const rest = words.slice(2).join(' ');
      const m = /repos\/([^/\s]+)\/([^/\s]+)\/pulls\/(\d+)\/merge\b/.exec(rest);
      if (m) preMerge({ owner: m[1], repo: m[2], pullNumber: Number(m[3]) }, 'gh api …/merge');
      if (/\b(mergePullRequest|enablePullRequestAutoMerge)\b/.test(rest)) block(`Chặn merge qua gh api graphql: cổng verify không đọc được PR nào. Dùng mcp__github__merge_pull_request sau ${verifyCmd()} -- --full.`);
    }
  }
  for (const extra of CONFIG.preBash) {
    const message = extra({ command, cwd, calls: all, gitCalls: (sub) => gitCalls(command, sub, cwd), ROOT });
    if (message) block(message);
  }
}

const GH_VALUED = new Set(['-b', '--body', '-F', '--body-file', '-t', '--subject', '--match-head-commit', '-A', '--author-email']);
function ghPrMerge(args, dir) {
  let target = null;
  let repoArg = null;
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    if (a === '-R' || a === '--repo') { repoArg = args[i + 1]; i += 1; } else if (a.startsWith('--repo=')) repoArg = a.slice(7);
    else if (GH_VALUED.has(a)) i += 1;
    else if (!a.startsWith('-') && target === null) target = a;
  }
  if (!repoArg && !insideRoot(dir)) return; // gh picks the repository from the directory it runs in
  const [owner, repo] = repoArg ? repoArg.split('/').slice(-2) : [];
  const url = /github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/.exec(target || '');
  let n = url ? Number(url[3]) : /^#?\d+$/.test(target || '') ? Number(target.replace('#', '')) : null;
  if (n === null) {
    // A branch name or nothing (the current branch's PR): ask gh which PR that is.
    const r = spawnSync('gh', ['pr', 'view', ...(target ? [target] : []), '--json', 'number', ...(repoArg ? ['-R', repoArg] : [])], { cwd: dir ?? ROOT, encoding: 'utf8', timeout: 8000 });
    try { n = JSON.parse(r.stdout).number; } catch { n = null; }
    if (!n) block(`Chặn gh pr merge: không xác định được số PR${target ? ` của "${target}"` : ' của nhánh hiện tại'}. Dùng mcp__github__merge_pull_request với pullNumber.`);
  }
  preMerge({ owner: url ? url[1] : owner, repo: url ? url[2] : repo, pullNumber: n }, 'gh pr merge');
}

// ---- pre-merge ----
// Head sha of PR n: the pull ref on origin, else GitHub's own answer through gh. Never a guess from local HEAD.
function prHead(n, tool) {
  const remote = gitNet(['ls-remote', 'origin', `refs/pull/${n}/head`], 8000);
  const head = /^[0-9a-f]{40}\b/.exec(remote.stdout || '')?.[0];
  if (head) return { head, source: `git ls-remote origin refs/pull/${n}/head` };
  const repoArg = tool.owner && tool.repo ? ['-R', `${tool.owner}/${tool.repo}`] : [];
  const r = spawnSync('gh', ['pr', 'view', String(n), '--json', 'headRefOid,headRefName', ...repoArg], { cwd: ROOT, encoding: 'utf8', timeout: 8000 });
  try {
    const pr = JSON.parse(r.stdout);
    if (/^[0-9a-f]{40}$/.test(pr.headRefOid)) return { head: pr.headRefOid, source: `gh pr view ${n} (nhánh ${pr.headRefName})` };
  } catch { /* no answer */ }
  return { head: null, source: '' };
}

const FILE_TOOL = /__(push_files|create_or_update_file|delete_file)$/;
function preMerge(tool, via = 'mcp__github__merge_pull_request', toolName = '') {
  const slug = git(['remote', 'get-url', 'origin'], { allowFail: true }).replace(/\.git$/, '').match(/([^/:]+\/[^/:]+)$/)?.[1];
  if (tool.owner && tool.repo && slug && slug.toLowerCase() !== `${tool.owner}/${tool.repo}`.toLowerCase()) return; // another repo: not this repo's gate
  if (FILE_TOOL.test(toolName)) {
    // These write commits straight onto a branch on GitHub; no local verify can cover them.
    const branch = String(tool.branch || '').replace(/^refs\/heads\//, '');
    if (!branch || PROD.includes(branch)) block(`Chặn ${toolName.split('__').pop()} lên ${branch || 'nhánh mặc định'}: ghi thẳng vào nhánh prod, bỏ qua PR và verify. Ghi vào nhánh riêng rồi mở PR.`);
    return;
  }
  const n = Number(tool.pullNumber ?? tool.pull_number);
  if (!Number.isInteger(n) || n <= 0) block('Chặn merge: thiếu pullNumber nên không xác định được PR.');
  const { head, source } = prHead(n, tool);
  if (!head) block(`Chặn merge PR #${n} (${via}): không xác định được head sha (git ls-remote origin refs/pull/${n}/head và gh pr view ${n} đều không trả lời). Kiểm số PR và mạng, rồi thử lại.`);
  const problems = verifyProblems(readLastVerify(), head, 'head PR');
  if (!problems.length) return;
  const steps = [
    headSha() !== head && `HEAD đang là ${short(headSha())}, khác head PR: checkout nhánh của PR và git pull (hoặc git fetch origin pull/${n}/head && git checkout ${short(head)})`,
    'git status phải sạch (commit hoặc stash thay đổi)',
    `${verifyCmd()} -- --full → exit 0`,
    'merge lại. Không lách hook; FAIL thì sửa nguyên nhân',
  ].filter(Boolean);
  block(`Chặn merge PR #${n} (${via}): cần ${verifyCmd()} -- --full exit 0 cho đúng head sha ${short(head)} (nguồn: ${source}).
Verify lần cuối: ${problems.join('; ')}.
${steps.map((s, i) => `  ${i + 1}. ${s}`).join('\n')}`);
}

// ---- post-pr ----
function postPr(input) {
  const tool = input.tool_input || {};
  const merge = /merge_pull_request$/.test(input.tool_name || '');
  // A merge moves a prod branch on GitHub; refresh the local refs so the ladder is not stale.
  const fetched = !merge || PROD.map((b) => gitNet(['fetch', '--quiet', '--no-tags', 'origin', `+refs/heads/${b}:refs/remotes/origin/${b}`], 4000).status).every((s) => s === 0);
  const url = JSON.stringify(input.tool_response ?? '').match(/https:\/\/github\.com\/[^\s"'\\]+\/pull\/\d+/)?.[0];
  const what = merge
    ? `PR #${tool.pullNumber ?? '?'} đã merge trên GitHub. Prod chưa đổi cho tới khi deploy; squash merge thì git không thấy HEAD trong ${PROD[0]}, đối chiếu bằng số PR.`
    : `PR đã mở: ${url || '(không đọc được link)'} (${tool.head || 'nhánh hiện tại'} → ${tool.base || '?'}).`;
  context('PostToolUse', [what, ...deployLadder(), fetched ? '' : `(không fetch được origin: vị trí ${PROD.join('/')} có thể cũ)`, 'Báo cho người dùng nấc deploy hiện tại; merge ≠ đã lên.'].filter(Boolean).join('\n'));
}

// ---- post-edit ----
// The file just before this Edit/MultiEdit, rebuilt by undoing the edit on the current text; null when unknown (Write).
function beforeEdit(tool, now) {
  const edits = Array.isArray(tool.edits) ? tool.edits : typeof tool.new_string === 'string' ? [tool] : null;
  if (!edits) return null;
  let text = now;
  for (const e of [...edits].reverse()) {
    if (!e.new_string || !text.includes(e.new_string)) return null;
    const old = String(e.old_string ?? '');
    text = e.replace_all ? text.split(e.new_string).join(old) : text.replace(e.new_string, () => old);
  }
  return text;
}

async function postEdit(tool) {
  if (!CONFIG.postEdit.length) return;
  const file = rel(tool.file_path);
  if (!file || file.startsWith('../') || !existsSync(join(ROOT, file))) return;
  const now = readFileSync(join(ROOT, file), 'utf8');
  const head = git(['show', `HEAD:${file}`], { allowFail: true }); // '' for a new file
  const problems = [];
  for (const rule of CONFIG.postEdit) {
    if (rule.files && !rule.files.test(file)) continue;
    problems.push(...((await rule.check({ file, now, head, before: beforeEdit(tool, now), tool, ROOT })) || []));
  }
  if (problems.length) block(problems.join('\n'));
}

// ---- stop ----
const SHIP_TOOL = /^mcp__.*github.*__(create_pull_request|merge_pull_request|enable_pr_auto_merge|push_files|create_or_update_file|delete_file)$/;
const EDIT_TOOLS = new Set(['Edit', 'Write', 'MultiEdit', 'NotebookEdit']);
// What a Bash command ships: a push, or a PR opened or merged through gh. null when it ships nothing.
function shipsInBash(command, cwd) {
  if (gitCalls(command, 'push', cwd).length) return 'git push';
  for (const { words: w } of calls(command, cwd)) {
    if (basename(w[0] || '') !== 'gh') continue;
    if (w[1] === 'pr' && (w[2] === 'merge' || w[2] === 'create')) return `gh pr ${w[2]}`;
    if (w[1] === 'api' && /\/pulls\/\d+\/merge\b|mergePullRequest/.test(w.join(' '))) return 'gh api merge';
  }
  return null;
}
// Bash that may change the tree, for the verify reminder. Reads (grep, cat, ls, git status/diff/log, test runs)
// do not count, so a Q&A turn is not pushed into a verify run because someone else edited files.
const GIT_WRITES = new Set(['apply', 'am', 'checkout', 'switch', 'restore', 'reset', 'merge', 'rebase', 'pull', 'cherry-pick', 'revert', 'mv', 'rm', 'stash', 'clean', 'commit', 'add']);
const WRITERS = new Set(['mv', 'cp', 'rm', 'touch', 'truncate', 'patch', 'install', 'ln', 'rsync', 'unzip', 'tar', 'dd', 'tee', 'python', 'python3', 'perl', 'ruby']);
const RUNNERS = new Set(['node', 'nodejs', 'bun', 'deno', 'npx', 'tsx']);
function writesFiles(command, cwd) {
  const code = command.replace(HEREDOC, '<<$2$3').replace(/'[^']*'|"(?:\\.|[^"\\])*"/g, "''");
  for (const m of code.matchAll(/(?:^|[^<>&\d])>>?\s*([^\s;&|)]+)/g)) if (!/^(&|\/dev\/|\/tmp\/|\$\{?TMPDIR)/.test(m[1])) return true;
  return calls(command, cwd).some(({ words: w }) => {
    const p = basename(w[0] || '');
    if (WRITERS.has(p)) return true;
    if (p === 'sed') return w.some((a) => /^-[a-zA-Z]*i|^--in-place/.test(a));
    if (p === 'git') return GIT_WRITES.has(gitCall({ words: w, dir: ROOT })?.sub);
    if (['npm', 'pnpm', 'yarn'].includes(p)) return w.some((a) => ['ci', 'i', 'install', 'uninstall', 'update', 'build', 'add'].includes(a));
    if (RUNNERS.has(p)) {
      const at = w.findIndex((a) => a === '-e' || a === '--eval' || a === '-p');
      return w.some((a) => ['--write', '--fix', 'build'].includes(a)) || (at > 0 && /write|unlink|rm(Sync)?\(|rename|mkdir|copyFile|appendFile/.test(w[at + 1] || ''));
    }
    return false;
  });
}
const humanText = (c) => (typeof c === 'string' ? c.trim() !== '' : Array.isArray(c) && c.some((b) => b?.type === 'text') && !c.some((b) => b?.type === 'tool_result'));
// Assistant content blocks since the last message the person typed (tool results arrive as user rows too).
function currentTurn(path) {
  let rows;
  try { rows = readFileSync(path, 'utf8').split('\n'); } catch { return null; }
  const turn = [];
  for (let i = rows.length - 1; i >= 0; i -= 1) {
    if (!rows[i].trim()) continue;
    let e;
    try { e = JSON.parse(rows[i]); } catch { continue; }
    if (e.isSidechain) continue;
    if (e.type === 'user' && !e.isMeta && humanText(e.message?.content)) break;
    if (e.type === 'assistant' && Array.isArray(e.message?.content)) turn.unshift(...e.message.content);
  }
  return turn;
}

function stop(input) {
  if (input.stop_hook_active) return; // already continued once because of a stop hook
  const turn = currentTurn(input.transcript_path);
  if (!turn) return;
  const cwd = input.cwd || ROOT;
  const uses = turn.filter((b) => b?.type === 'tool_use');
  const bash = (u) => (u.name === 'Bash' ? String(u.input?.command || '') : null);
  const out = [];
  const shipped = uses.map((u) => (SHIP_TOOL.test(u.name) ? u.name.split('__').pop() : bash(u) !== null ? shipsInBash(bash(u), cwd) : null)).filter(Boolean);
  if (shipped.length) {
    const lastUse = turn.findLastIndex((b) => b?.type === 'tool_use');
    const finalText = typeof input.last_assistant_message === 'string' ? input.last_assistant_message
      : turn.slice(lastUse + 1).filter((b) => b?.type === 'text').map((b) => b.text).join('\n');
    if (!/deploy/i.test(finalText)) {
      out.push(`Lượt này có ${[...new Set(shipped)].join(', ')} nhưng câu trả lời cuối chưa nói nấc deploy. Thêm vào câu trả lời (không nói "đã lên/đã live"; chỉ chủ sản phẩm xác nhận deploy):\n${deployLadder().join('\n')}`);
    }
  }
  if (uses.some((u) => EDIT_TOOLS.has(u.name) || (bash(u) !== null && writesFiles(bash(u), cwd)))) {
    const [head, hash, last] = [headSha(), diffHash(), readLastVerify()];
    const verified = last && last.sha === head && last.diff_hash === hash;
    const code = verified ? [] : changedFiles().files.filter((f) => CONFIG.codePaths.test(f));
    const store = join(stateDir(), 'stop-reminded.json');
    let seen = [];
    try { seen = JSON.parse(readFileSync(store, 'utf8')); } catch { /* first reminder */ }
    const key = `${head}:${hash}`;
    if (code.length && !seen.includes(key)) {
      writeFileSync(store, `${JSON.stringify([...seen.slice(-49), key])}\n`);
      const was = last ? `lần cuối: ${last.mode} exit ${last.exit} @${short(last.sha)}${last.sha === head ? ', cây đã đổi sau đó' : ''}` : 'chưa chạy lần nào';
      out.push(`Code đã đổi (${code.length} file) mà chưa verify trạng thái này (${was}). Chạy ${verifyCmd()} (trước merge: ${verifyCmd()} -- --full) và báo PASS/FAIL kèm lệnh + exit code. Nhắc một lần cho trạng thái này.`);
    }
  }
  if (out.length) block(out.join('\n\n'));
}

const MODES = {
  session: () => session(),
  'pre-edit': (input) => preEdit(input.tool_input || {}),
  'pre-bash': (input) => preBash(input),
  // Also wired to enable_pr_auto_merge and to the MCP tools that commit straight onto a branch.
  'pre-merge': (input) => preMerge(input.tool_input || {}, input.tool_name || 'mcp__github__merge_pull_request', input.tool_name || ''),
  'post-pr': (input) => postPr(input),
  'post-edit': (input) => postEdit(input.tool_input || {}),
  stop: (input) => stop(input),
};
// Commands that reach a prod branch; while lib.mjs does not load they are blocked instead of waved through.
const RISKY = /\bgh\s+pr\s+merge\b|\bgh\s+api\b[\s\S]*\/merge\b|\bmergePullRequest\b|\bgit\b[\s\S]*\bpush\b/;

const mode = process.argv[2];
if (!MODES[mode]) {
  process.stderr.write(`dùng: node scripts/harness/hooks.mjs ${Object.keys(MODES).join('|')}\n`);
  process.exitCode = 1;
} else {
  let input = {};
  try { input = process.stdin.isTTY ? {} : JSON.parse(readFileSync(0, 'utf8') || '{}'); } catch { input = {}; }
  if (loadError) {
    const closed = mode === 'pre-merge' || (mode === 'pre-bash' && RISKY.test(String(input.tool_input?.command || '')));
    process.stderr.write(`hooks.mjs ${mode}: không nạp được scripts/harness/lib.mjs hoặc harness.config.mjs: ${String(loadError?.message || loadError).split('\n')[0]}${closed ? '\nChặn merge/push cho tới khi harness chạy lại (node --check scripts/harness/lib.mjs scripts/harness/harness.config.mjs).' : ''}\n`);
    process.exitCode = closed ? 2 : 1;
  } else {
    try {
      await MODES[mode](input);
    } catch (error) {
      if (error instanceof Block) {
        process.stderr.write(`${error.message.trimEnd()}\n`);
        process.exitCode = 2;
      } else {
        // A broken hook must not wedge the session, except the merge gate, which fails closed.
        process.stderr.write(`hooks.mjs ${mode}: lỗi nội bộ: ${error?.stack || error}\n`);
        process.exitCode = mode === 'pre-merge' ? 2 : 1;
      }
    }
  }
}
