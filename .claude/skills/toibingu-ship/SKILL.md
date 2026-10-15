---
name: toibingu-ship
description: Use when committing, opening or merging a PR, handing work back, or when asked whether a change is live in Toibingu. Vietnamese triggers include commit, mở PR, merge, đưa lên, deploy, bàn giao, "đã lên chưa", "lên prod chưa".
---

# toibingu-ship: verify, PR, release ladder

The rules live in AGENTS.md: §2 (the loop), §3 (statuses), §4 (release truth) and §8 (git and merge rule). This file only lists the steps.

## Steps
1. If the change alters product behaviour, RD-TBT001 or the matching `SD-TB*` doc is updated in the same branch (skill `toibingu-design-change`).
2. Commit everything first, so `git status` is clean.
3. Run `pnpm verify -- --full`. Fix every FAIL or INVALID and run it again. Each remaining NOT_TESTED needs a one-line reason.
4. Fill in `.github/PULL_REQUEST_TEMPLATE.md`: the request verbatim plus 3–7 acceptance criteria tied to a test or command, the `REQ-0nn` / `SD-TB…` ids touched, and the verify summary pasted unchanged with its `sha=` matching HEAD.
5. Copy the two ladder lines (`THANG:` and `DEPLOY:`) into the PR's Deploy section.
6. Write the Rollback line.
7. Merge only under the merge rule (AGENTS.md §8). A new commit on the PR means running `--full` again.
8. After pushing, opening or merging a PR, tell the user the exact ladder rung. Never say "deployed" or "live".

## Done when
- `pnpm verify -- --full` exited 0, its `sha=` matches the PR head, and every NOT_TESTED has a reason.
- The PR body has acceptance criteria, the verify summary, the release ladder and a rollback line.
- The final message to the user names the ladder rung and says the deploy is not yet confirmed.
