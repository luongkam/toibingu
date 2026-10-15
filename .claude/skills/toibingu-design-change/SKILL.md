---
name: toibingu-design-change
description: Use before changing what Toibingu does (a new feature, screen, data source, ranking or publish rule, retention, policy) or when asked to write or update requirements, RD, SD, system design or architecture. Vietnamese triggers include yêu cầu, requirement, thiết kế hệ thống, SD, RD, kiến trúc, thêm nguồn dữ liệu, đổi luật xếp hạng, thêm tính năng.
---

# toibingu-design-change: RD and SD before code

Requirement (WHAT) lives in `docs/01-rd/RD-REQ/RD-TBT001-customer-requirements.md`; system design (HOW) in `docs/01-sd/` (index `SD-INDEX.md`). Rules: AGENTS.md §1 and §5.

## Steps
1. Find the affected `REQ-0nn` (RD §2) and SD docs via the RD §10 Traceability Matrix. New behaviour gets a new `REQ-0nn` with Goal, Behavior, Acceptance Criteria, UAT (Given/When/Then) and Traceability, plus a matrix row.
2. Decide the phase (P1, P2, NOW-NOT, RD §3–§4). Anything in RD §4 Out of scope needs the owner's OK first.
3. Update the SD doc of the right type: X context, H architecture/decisions (add a row with reason and "xem lại khi"), N NFR, I integration (limits, failure mode), Y data (entity, retention), P policy. A new SD doc: `SD-TB<letter>NNN-<slug>.md` in its subfolder, `doc_id` frontmatter, `depends_on`, a row in `SD-INDEX.md`.
4. Tier L topics (AGENTS.md §1: data sources, ranking/publish rules, personal data, contributions, auth, deploy) also need `plans/<yymmdd-hhmm>-<slug>/plan.md` and the owner's OK.
5. If a business rule changes, update AGENTS.md §6 and the test that locks it in the same PR.
6. Run `node scripts/ci/check-docs.mjs` (NEXA G1/G1_5, ids, trace), then continue with code and `pnpm verify`.

## Done when
- `check-docs` exits 0, every new REQ is in the matrix, every SD cites RD-TBT001.
- No em dash in `docs/01-rd` or `docs/01-sd`; no SQL or logic blocks in SD.
- Open questions the change raises are added to RD §7 with an owner.
