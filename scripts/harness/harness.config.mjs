// Project settings for the NEXA harness. scripts/harness/{lib,verify,hooks}.mjs are verbatim copies of the starter in
// nexa-v3-2 packages/templates/builtin-claude/skills/nexa-harness-upgrade/assets/harness (copied at nexa-v3-2@d80fe5c).
// Never edit those three files here: project rules live in this file.

const touched = (re) => ({ files, full }) => full || files.some((f) => re.test(f)) || 'diff không chạm phần này';

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
    // NEXA G1/G1_5 + id/trace rules for docs/01-rd and docs/01-sd (scripts/ci/check-docs.mjs).
    { id: 'docs', when: touched(/^(docs\/0[0-9]-|\.nexa\/|scripts\/ci\/check-docs)/), run: [process.execPath, 'scripts/ci/check-docs.mjs'] },
    { id: 'typecheck', when: touched(/\.(m?tsx?|json)$/), run: ['pnpm', 'typecheck'] },
    { id: 'tests', when: touched(/^(packages|apps|scripts\/ci)\/|^package\.json$|^tsconfig/), run: ['pnpm', 'test'] },
    { id: 'harness', when: touched(/^(scripts\/harness|tests\/harness)\//), run: [process.execPath, '--test', 'tests/harness/harness.test.mjs'] },
  ],

  protectedPaths: [
    { pattern: /^scripts\/harness\/(lib|verify|hooks)\.mjs$/, label: 'harness engine', message: 'bản chép nguyên của starter NEXA. Sửa starter trong nexa-v3-2 (nexa-harness-upgrade), rồi chép lại; luật riêng để trong harness.config.mjs.' },
    { pattern: /^pnpm-lock\.yaml$/, label: 'pnpm-lock.yaml', message: 'không sửa tay. Chạy pnpm add/remove/install để sinh lại.' },
  ],

  blockedCommands: [
    {
      label: 'deploy production',
      // Also catches runner prefixes: `npx vercel --prod`, `pnpm dlx vercel deploy --prod`, `flyctl deploy`.
      match: (w) => {
        const tool = w.slice(0, 3).find((x) => /^(vercel|fly|flyctl)$/.test(x));
        return tool === 'vercel' ? w.includes('--prod') : Boolean(tool) && w.includes('deploy');
      },
      message: 'Deploy production là việc của owner (AGENTS.md §4). Agent dừng ở PR + verify --full.',
    },
  ],

  codePaths: /^(apps|packages|scripts|tests)\//,

  deploy: {
    lockfiles: ['pnpm-lock.yaml'],
    finalRung: 'deploy toibingu.vn: CHƯA XÁC NHẬN (chưa có môi trường; chỉ owner xác nhận)',
  },

  sessionNotes: [
    'Chưa có môi trường deploy và chưa có nhánh main: verify --full local là cổng duy nhất.',
    'RD/SD là bắt buộc: đổi hành vi sản phẩm = sửa docs/01-rd hoặc docs/01-sd trong cùng PR.',
  ],
};
