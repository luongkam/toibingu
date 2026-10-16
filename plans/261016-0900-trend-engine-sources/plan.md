# Plan: trend engine data sources (Tier L)

- **Request (verbatim, 2026-10-16):** "Cần 1 skill / engine liên tục udpate các từ lóng, trend hot trên các nền tảng: thread, tiktok, facebook,..." · "6, ok và thêm nhiều quyền nữa".
- **Goal:** REQ-017 lexicon and REQ-009 discovery fed by every platform we may lawfully read, starting now with what needs no approval.
- **Why Tier L:** new data sources and platform credentials (AGENTS.md §1).
- **Already done without new sources (Tier S):** `packages/lexicon`, `extractAskedTerms`, skill `toibingu-trend-scout`, `data/lexicon`.

## Touch points
- `packages/ingest/src/adapters/{threads,instagram-hashtag,tiktok-discovery,google-trends}.ts` (new), each returning `Source` with `accessMethod: "official_api"`. YouTube: editor search only, never a heat signal (SD-TBI001 I-06).
- `apps/worker` jobs: poll per SD-TBI001 budgets; write `Signal`, `Post`; feed `discoverCandidates`.
- Secrets in env on the owner machine only (per-editor Threads tokens, `IG_ACCESS_TOKEN`, TikTok Business token, `YOUTUBE_API_KEY`); never in repo.
- SD-TBI001 §3 rows IF-01, IF-02, IF-08..IF-12; access checklist `docs/00-intake/research/platform-access.md`.

## Acceptance
- Each adapter has a fake-transport test (no network, AGENTS.md §7) for: success, quota exhausted, permission missing → source marked `degraded`, pipeline continues.
- No adapter for a platform without an official permitted path (TikTok, Facebook public content: editor/user path only until access is granted).
- `pnpm verify -- --full` exit 0.

## Out of scope
- Scraping, logged-in browsing automation, private groups, buying third-party scraped datasets.

## Assumptions
- Owner submits the app reviews in the checklist; adapters ship behind "credential present" checks.

## Risks
- App review rejection or delay (Threads keyword search, TikTok): engine still runs on YouTube, Google Trends, users, editors, scout skill.
- Quota limits: budgets per community in SD-TBI001 I-02.

## How to try it
- `pnpm test` (fakes); with credentials on the owner machine: `node apps/worker/src/run-once.ts --source google-trends` (to be added).

**Owner OK on this plan:** PENDING (adapter code waits for it).
