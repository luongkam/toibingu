---
doc_id: SD-{DOMAIN}P{NNN}
title: "Common Policy"
phase: SD
sd_type: P
status: AI_GENERATED
depends_on: [RD-{DOMAIN}T001, {other RD ids}, {SD-{DOMAIN}{T}000 if the list doc exists}]
---

# SD-{DOMAIN}P{NNN} 共通方針 / Common Policy

## 1. システム概要 / Purpose
{What this system-level decision covers and why it is needed now. 2-5 sentences, project-specific.}

## 2. システム境界 / System boundary (Scope)
- 対象 / In scope: {...}
- 対象外 / Out of scope: {... (screen items are BD, logic and DDL are DD)}

## 3. 設計方針 / Design decisions
| # | Decision | Rationale | Alternatives rejected | RD |
|---|---|---|---|---|
| D1 | {...} | {...} | {...} | {RD-...} |

## 4. 共通方針一覧 / Policies
| Area | Policy | Applies to | Enforced by |
|---|---|---|---|
| ログ / Logging | {...} | {...} | {...} |
| エラー処理 / Error handling | {...} | {...} | {...} |
| 認証・認可 / AuthN and AuthZ | {...} | {...} | {...} |
| 日時・タイムゾーン / Date and time zone | {...} | {...} | {...} |
| 多言語 / i18n | {...} | {...} | {...} |
| 監査 / Audit trail | {...} | {...} | {...} |

## 5. 命名とコード値 / Naming and code values
{Id rules, code tables, units. Item-level definitions belong to BD/DD.}

## 6. 非機能・連携への影響 / Impact on NFR and integration
{Which N and I SDs rely on these policies.}

## 7. RD トレース / Traceability
| SD item | RD id | Note |
|---|---|---|
| {D1} | {RD-{DOMAIN}{T}{NNN} | {...} |

## 8. 未確定事項 / Open questions
| # | Question | Owner | Due |
|---|---|---|---|
| Q1 | {...} | {customer / team} | {date} |
