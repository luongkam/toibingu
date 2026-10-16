---
doc_id: SD-{DOMAIN}N{NNN}
title: "Non-functional Design (NFR)"
phase: SD
sd_type: N
status: AI_GENERATED
depends_on: [RD-{DOMAIN}T001, {other RD ids}, {SD-{DOMAIN}{T}000 if the list doc exists}]
---

# SD-{DOMAIN}N{NNN} 非機能要件設計 / Non-functional Design (NFR)

## 1. システム概要 / Purpose
{What this system-level decision covers and why it is needed now. 2-5 sentences, project-specific.}

## 2. システム境界 / System boundary (Scope)
- 対象 / In scope: {...}
- 対象外 / Out of scope: {... (screen items are BD, logic and DDL are DD)}

## 3. 設計方針 / Design decisions
| # | Decision | Rationale | Alternatives rejected | RD |
|---|---|---|---|---|
| D1 | {...} | {...} | {...} | {RD-...} |

## 4. 非機能要求グレード / NFR targets
| Category | Item | Target | How measured | RD |
|---|---|---|---|---|
| 可用性 / Availability | {...} | {...} | {...} | {RD-...} |
| 性能・拡張性 / Performance and scalability | {...} | {...} | {...} | {RD-...} |
| 運用・保守性 / Operability | {...} | {...} | {...} | {RD-...} |
| 移行性 / Migration | {...} | {...} | {...} | {RD-...} |
| セキュリティ / Security | {...} | {...} | {...} | {RD-...} |

## 5. 設計上の対策 / Design measures
{One measure per target: redundancy, caching, rate limits, backups, encryption, monitoring.}

## 6. 検証方法 / Verification
{Load test, failover drill, security scan: which phase proves each target.}

## 7. RD トレース / Traceability
| SD item | RD id | Note |
|---|---|---|
| {D1} | {RD-{DOMAIN}{T}{NNN} | {...} |

## 8. 未確定事項 / Open questions
| # | Question | Owner | Due |
|---|---|---|---|
| Q1 | {...} | {customer / team} | {date} |
