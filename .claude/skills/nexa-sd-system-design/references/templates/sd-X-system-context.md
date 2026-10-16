---
doc_id: SD-{DOMAIN}X{NNN}
title: "System Context"
phase: SD
sd_type: X
status: AI_GENERATED
depends_on: [RD-{DOMAIN}T001, {other RD ids}, {SD-{DOMAIN}{T}000 if the list doc exists}]
---

# SD-{DOMAIN}X{NNN} システムコンテキスト / System Context

## 1. システム概要 / Purpose
{What this system-level decision covers and why it is needed now. 2-5 sentences, project-specific.}

## 2. システム境界 / System boundary (Scope)
- 対象 / In scope: {...}
- 対象外 / Out of scope: {... (screen items are BD, logic and DDL are DD)}

## 3. 設計方針 / Design decisions
| # | Decision | Rationale | Alternatives rejected | RD |
|---|---|---|---|---|
| D1 | {...} | {...} | {...} | {RD-...} |

## 4. アクターと外部システム / Actors and external systems
| Actor / system | Kind (user, external system, operator) | Interaction | Integration id (SD-..I..) |
|---|---|---|---|
| {...} | {...} | {...} | {...} |

## 5. コンテキスト図 / Context diagram
```mermaid
flowchart LR
  user[{Actor}] --> sys[{System}]
  sys --> ext[{External system}]
```

## 6. 連携先一覧 / Integration points (summary)
{One line per integration; details live in the integration-architecture SD.}

## 7. RD トレース / Traceability
| SD item | RD id | Note |
|---|---|---|
| {D1} | {RD-{DOMAIN}{T}{NNN} | {...} |

## 8. 未確定事項 / Open questions
| # | Question | Owner | Due |
|---|---|---|---|
| Q1 | {...} | {customer / team} | {date} |
