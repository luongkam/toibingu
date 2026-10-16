---
doc_id: SD-{DOMAIN}I{NNN}
title: "Integration Architecture"
phase: SD
sd_type: I
status: AI_GENERATED
depends_on: [RD-{DOMAIN}T001, {other RD ids}, {SD-{DOMAIN}{T}000 if the list doc exists}]
---

# SD-{DOMAIN}I{NNN} 連携方式設計 / Integration Architecture

## 1. システム概要 / Purpose
{What this system-level decision covers and why it is needed now. 2-5 sentences, project-specific.}

## 2. システム境界 / System boundary (Scope)
- 対象 / In scope: {...}
- 対象外 / Out of scope: {... (screen items are BD, logic and DDL are DD)}

## 3. 設計方針 / Design decisions
| # | Decision | Rationale | Alternatives rejected | RD |
|---|---|---|---|---|
| D1 | {...} | {...} | {...} | {RD-...} |

## 4. 連携一覧 / Integration inventory
| Id | Counterpart | Direction | Protocol | Frequency / volume | Data | Error handling |
|---|---|---|---|---|---|---|
| {IF-01} | {...} | {in / out} | {REST / file / queue} | {...} | {...} | {...} |

## 5. 連携共通方針 / Integration policies
- 認証 / Authentication: {...}
- 再送と冪等性 / Retry and idempotency: {...}
- タイムアウト / Timeouts: {...}
- 文字コードと日時 / Encoding and date-time: {...}

## 6. 障害時の回復 / Failure and recovery
{What happens when each counterpart is down; who is alerted; how data is reconciled.}

## 7. RD トレース / Traceability
| SD item | RD id | Note |
|---|---|---|
| {D1} | {RD-{DOMAIN}{T}{NNN} | {...} |

## 8. 未確定事項 / Open questions
| # | Question | Owner | Due |
|---|---|---|---|
| Q1 | {...} | {customer / team} | {date} |
