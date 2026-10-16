// Project settings for the NEXA harness. scripts/harness/{lib,verify,hooks,check-docs}.mjs are verbatim copies of the
// starter in nexa-v3-2 packages/templates/builtin-claude/skills/nexa-harness-upgrade/assets/harness (copied at
// nexa-v3-2@2670b71, PR luongkam/nexa-v3-2#431). Never edit those files here: project rules live in this file.

const touched = (re) => ({ files, full }) => full || files.some((f) => re.test(f)) || 'diff không chạm phần này';

// Toibingu-only doc rules on top of the shipped checker (AGENTS.md §5).
// Every REQ-0nn heading in the RD has a row in its "## N. Traceability Matrix".
const reqTrace = ({ kind, body }) => {
  if (kind !== 'rd') return [];
  const reqs = [...new Set([...body.matchAll(/^### (REQ-\d{3})\b/gm)].map((m) => m[1]))];
  const matrix = body.split(/^## \d+\. Traceability Matrix/m)[1];
  if (reqs.length && matrix === undefined) return ['thiếu mục "## N. Traceability Matrix"'];
  return reqs.filter((r) => !new RegExp(`^\\| ${r} \\|`, 'm').test(matrix ?? '')).map((r) => `${r} chưa có trong Traceability Matrix`);
};
// NEXA G1_5 only warns on SQL / logic blocks in SD; here they fail: they belong in 03-dd.
const sdNoDetail = ({ kind, body }) => (kind === 'sd' && /\bCREATE\s+TABLE\b|\bSELECT\b[\s\S]{0,200}?\bFROM\b|ロジックブロック|logic block/i.test(body) ? ['SQL / logic block là detailed design, thuộc 03-dd'] : []);

export default {
  project: 'toibingu',
  base: 'origin/main',
  // Prod branch NOT CONFIRMED: the repo has no default branch yet. `main` is the planned trunk (AGENTS.md §4).
  prodBranches: ['main'],
  stateName: 'nexa-verify',
  verifyCommand: 'pnpm verify',

  agentsMd: {
    maxLines: 150,
    forbid: [
      { pattern: /\b\d+\s+(tests?|checks?|packages?|REQs?)\b/i, why: 'số đếm cứng; verify in số hiện tại' },
    ],
  },

  checks: [
    // NEXA G1/G1_5 + id, folder, domain, status, depends_on, SD-INDEX and em dash rules for docs/01-rd and docs/01-sd
    // (shipped checker scripts/harness/check-docs.mjs, settings in `docs` below).
    { id: 'docs', when: touched(/^(docs\/0[0-9]-|\.nexa\/|scripts\/harness\/(check-docs|harness\.config)\.mjs)/), run: [process.execPath, 'scripts/harness/check-docs.mjs'] },
    { id: 'typecheck', when: touched(/\.(m?tsx?|json)$/), run: ['pnpm', 'typecheck'] },
    { id: 'tests', when: touched(/^(packages|apps|data|scripts\/ci)\/|^package\.json$|^tsconfig/), run: ['pnpm', 'test'] },
    { id: 'harness', when: touched(/^(scripts\/harness|tests\/harness)\//), run: [process.execPath, '--test', 'tests/harness/harness.test.mjs', 'tests/harness/check-docs.test.mjs'] },
  ],

  docs: {
    root: 'docs',
    rdFiles: /\.md$/, // every file in docs/01-rd is an RD document (AGENTS.md §5)
    requireFrontmatter: true,
    checkDependsOn: true,
    rules: [reqTrace, sdNoDetail],
  },

  protectedPaths: [
    { pattern: /^scripts\/harness\/(lib|verify|hooks|check-docs)\.mjs$/, label: 'harness engine', message: 'bản chép nguyên của starter NEXA. Sửa starter trong nexa-v3-2 (nexa-harness-upgrade), rồi chép lại; luật riêng để trong harness.config.mjs.' },
    { pattern: /^pnpm-lock\.yaml$/, label: 'pnpm-lock.yaml', message: 'không sửa tay. Chạy pnpm add/remove/install để sinh lại.' },
  ],

  blockedCommands: [
    {
      label: 'deploy production',
      // hooks.mjs unwraps npx / pnpm dlx|exec / yarn dlx / bunx before match, so w[0] is the real program.
      match: (w) => (w[0] === 'vercel' && w.includes('--prod')) || (['fly', 'flyctl'].includes(w[0]) && w.includes('deploy')),
      message: 'Deploy production là việc của owner (AGENTS.md §4). Agent dừng ở PR + verify --full.',
    },
  ],

  codePaths: /^(apps|packages|scripts|tests|data)\//,

  deploy: {
    lockfiles: ['pnpm-lock.yaml'],
    finalRung: 'deploy toibingu.vn: CHƯA XÁC NHẬN (chưa có môi trường; chỉ owner xác nhận)',
  },

  sessionNotes: [
    'Chưa có môi trường deploy và chưa có nhánh main: verify --full local là cổng duy nhất.',
    'RD/SD là bắt buộc: đổi hành vi sản phẩm = sửa docs/01-rd hoặc docs/01-sd trong cùng PR.',
  ],
};
