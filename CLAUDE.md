@AGENTS.md

# Claude Code notes (everything else lives in AGENTS.md)
- Hooks in `.claude/settings.json` run `scripts/harness/hooks.mjs` (project rules in `scripts/harness/harness.config.mjs`). They **block**:
  - a merge (`mcp__github__merge_pull_request`, auto-merge, `gh pr merge`, `gh api …/merge`) or a push onto `main` without a clean-tree `pnpm verify -- --full` exit 0 for that exact sha, and MCP file writes onto `main`. Prefer the MCP merge tool;
  - force-pushing or deleting `main`;
  - hand edits to `scripts/harness/{lib,verify,hooks}.mjs` (NEXA starter copies) and `pnpm-lock.yaml`;
  - production deploys (`vercel --prod`, `fly deploy`): deploy is the owner's.
  They also **feed back**: after a PR (the release ladder) and at Stop (once if you shipped without naming the ladder rung, once per tree state if code changed without a verify run).
  Fix the cause; never route around a hook.
- End every hand-off with the release ladder (AGENTS.md §4). Never say "deployed" or "live"; only the owner confirms that.
- Skills: `toibingu-ship` (verify, PR, merge, "đã lên chưa"), `toibingu-design-change` (RD/SD before code).
