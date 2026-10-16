# Plan: Page "Tôi bị ngu" auto-replies (Tier L)

- **Request (verbatim, 2026-10-16):** "khi họ đang xem 1 post facebook, học chỉ cần comment "Tôi bị ngu" thì 1 lúc sau page Tôi bị ngu sẽ trả lời họ. page này tôi sẽ tạo mới" · "người nào follow page thì mới được rep" · "support tình huống dễ hơn trước là user tag page "Tôi bị ngu", thì page sẽ trả lời auto".
- **Goal:** REQ-018: answer people where they are, within what Meta allows.
- **Why Tier L:** new platform, outbound automated replies, webhooks, Page tokens (AGENTS.md §1).
- **Platform reality (research 2026-10-16, SD-TBI001 I-11):** untagged comments elsewhere are invisible to the Page; follower status cannot be checked; replying under posts the Page does not moderate is undocumented (likely denied), impossible on profiles and groups.
- **Done in this PR (no network, Tier S logic):** `packages/fanpage` (`decideReply` T1, `decideMention` T2 with capability gate, `composeReply`), tests.

## Touch points (after OK)
- `packages/fanpage/src/graph.ts`: Graph client (reply to comment, private reply, Messenger send) with fake-transport tests; maps error 368 → stop all, permission error on T2 → `capability = denied`.
- `apps/page-bot`: webhook receiver (verify `X-Hub-Signature-256`, `hub.challenge`), parse `feed`/`mention`/`messages`, schedule decisions (2–10 min), persist reply state; runs on the owner machine behind the tunnel (SD-TBH001 H-14).
- Env only: `FB_PAGE_ID`, `FB_PAGE_TOKEN`, `FB_APP_SECRET`, `FB_VERIFY_TOKEN`, `MENTION_CAPABILITY` (default `unknown`).

## Acceptance
- Signature check rejects tampered payloads (test). Duplicate webhook deliveries never double-reply (test).
- T1 end to end with fakes: comment event → one scheduled reply with disclosure; unpublished dossier → none.
- T2 stays count-only until `MENTION_CAPABILITY=confirmed`; a permission error flips it to `denied` (test).
- Pilot evidence (manual, owner's test Pages) pasted in the PR for T2: PASS or FAIL with the API response.
- `pnpm verify -- --full` exit 0.

## Out of scope
- Comment-anywhere without tag; follower gating; replies on profiles or in groups; personal accounts; browser automation.

## Risks
- Page feature-limited for repetitive link comments: varied openers, caps, disclosure, stop on error 368.
- App Review delay: T1 works in Development mode for app-role users only, enough for a demo.

## How to try it
- `pnpm test`; with a test Page + tunnel on the owner machine: `node apps/page-bot/src/server.ts` (to be added).

**Owner OK on this plan:** PENDING (Graph client and webhook code wait for it).
