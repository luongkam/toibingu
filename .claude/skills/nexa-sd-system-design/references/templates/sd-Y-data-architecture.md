---
doc_id: SD-{DOMAIN}Y{NNN}
title: "Data Architecture"
phase: SD
sd_type: Y
status: AI_GENERATED
depends_on: [RD-{DOMAIN}T001, {other RD ids}, {SD-{DOMAIN}{T}000 if the list doc exists}]
---

# SD-{DOMAIN}Y{NNN} データ方式設計 / Data Architecture

## 1. システム概要 / Purpose
{What this system-level decision covers and why it is needed now. 2-5 sentences, project-specific.}

## 2. システム境界 / System boundary (Scope)
- 対象 / In scope: {...}
- 対象外 / Out of scope: {... (screen items are BD, logic and DDL are DD)}

## 3. 設計方針 / Design decisions
| # | Decision | Rationale | Alternatives rejected | RD |
|---|---|---|---|---|
| D1 | {...} | {...} | {...} | {RD-...} |

## 4. データ領域と主要エンティティ / Data domains and key entities
| Domain | Key entities (conceptual) | Owner system | Master or transaction |
|---|---|---|---|
| {...} | {...} | {...} | {...} |

## 5. データの流れ / Data flow
{Where data is created, copied, aggregated and archived. No table definitions here (that is DD).}

## 6. 保持と削除 / Retention and deletion
| Data | Retention | Deletion or anonymisation | Legal basis |
|---|---|---|---|
| {...} | {...} | {...} | {...} |

## 7. データ移行方針 / Data migration policy
{Source, cut-over approach, reconciliation.}

## 8. RD トレース / Traceability
| SD item | RD id | Note |
|---|---|---|
| {D1} | {RD-{DOMAIN}{T}{NNN} | {...} |

## 9. 未確定事項 / Open questions
| # | Question | Owner | Due |
|---|---|---|---|
| Q1 | {...} | {customer / team} | {date} |
