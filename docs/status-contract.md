# NEXA status contract (v0.3-lite)

A status is an evidence state, not an implementation opinion. `pnpm verify` prints these words; PR bodies and
hand-offs use them too.

## Allowed statuses

- `PASS`: the acceptance command ran, exit code 0, and the required evidence exists.
- `FAIL`: the command or its evidence shows the acceptance criterion is violated.
- `INVALID`: the run checked the wrong object, so it is neither PASS nor FAIL. Examples: a screenshot of another
  route, a result for another commit, or a check whose output cannot be read. Treat it like FAIL for merging.
- `NOT_TESTED`: no valid run was performed. Always give the reason.
- `BLOCKED_INPUT`: an owner decision, credential, fixture or other input is missing.
- `PENDING_AUTH`: a real authenticated session is required and unavailable.
- `WAIVED`: an explicit owner waiver exists, with a reason and an expiry.

## Rules

- Never report PASS without the exact command and its exit code.
- A PASS for a commit says nothing about later commits or an unclean working tree; rerun after changes.
- "Merged" and "deployed" are not statuses. Only the product owner confirms a deploy (see `AGENTS.md` §4).

## Evidence

The PR body is the record: the `pnpm verify -- --full` summary (sha, one line per check, exit code) and the
deploy ladder. Nothing is committed per run; verify keeps its last result in
`$(git rev-parse --git-path nexa-verify)/last.json`, outside the tracked tree.
