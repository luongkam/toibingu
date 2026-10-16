---
doc_id: SD-{DOMAIN}H{NNN}
title: "Architecture"
phase: SD
sd_type: H
status: AI_GENERATED
depends_on: [RD-{DOMAIN}T001, {other RD ids}, {SD-{DOMAIN}{T}000 if the list doc exists}]
---

# SD-{DOMAIN}H{NNN} 方式設計 / Architecture

## 1. システム概要 / Purpose
{What this system-level decision covers and why it is needed now. 2-5 sentences, project-specific.}

## 2. システム境界 / System boundary (Scope)
- 対象 / In scope: {...}
- 対象外 / Out of scope: {... (screen items are BD, logic and DDL are DD)}

## 3. 設計方針 / Design decisions
| # | Decision | Rationale | Alternatives rejected | RD |
|---|---|---|---|---|
| D1 | {...} | {...} | {...} | {RD-...} |

## 4. アーキテクチャ方式 / Architecture style
{Monolith / modular monolith / services, sync vs async, and why for this project.}

## 5. コンポーネント構成 / Container and component view
| Component | Responsibility | Technology | Owner |
|---|---|---|---|
| {...} | {...} | {...} | {...} |

## 6. 技術スタック / Technology stack
| Layer | Choice | Version policy | Reason |
|---|---|---|---|
| {...} | {...} | {...} | {...} |

## 7. 配置方式 / Deployment view
{Environments, regions, network zones, CI/CD path. Data and integration details: see the Y and I SDs.}

## 8. RD トレース / Traceability
| SD item | RD id | Note |
|---|---|---|
| {D1} | {RD-{DOMAIN}{T}{NNN} | {...} |

## 9. 未確定事項 / Open questions
| # | Question | Owner | Due |
|---|---|---|---|
| Q1 | {...} | {customer / team} | {date} |
