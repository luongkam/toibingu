# SD-INDEX.md - System Design (Design Definition)

System-level design, after `01-rd` and BEFORE `02-bd` (NEXA decision D8). Not Detailed Design (`03-dd`).

Scope: system context, architecture (方式設計), NFR, integration architecture, data architecture, common policy.
Ids: `SD-{DOMAIN}{X|H|N|I|Y|P}{NNN}`, domain `TB` (`.nexa/domain-registry.json`). Gate: NEXA `G1_5`, mirrored by the `docs` check in `pnpm verify`.

Upstream requirement: [RD-TBT001](../01-rd/RD-REQ/RD-TBT001-customer-requirements.md).

| Id | Title | Status | Depends on |
|---|---|---|---|
| [SD-TBX001](system-context/SD-TBX001-system-context.md) | System Context | INTERNAL_REVIEW | RD-TBT001 |
| [SD-TBH001](architecture/SD-TBH001-architecture.md) | Architecture and design decisions | INTERNAL_REVIEW | RD-TBT001, SD-TBX001 |
| [SD-TBN001](nfr/SD-TBN001-nfr.md) | Non-functional design | INTERNAL_REVIEW | RD-TBT001, SD-TBH001 |
| [SD-TBI001](integration-architecture/SD-TBI001-integration.md) | Integration architecture | INTERNAL_REVIEW | RD-TBT001, SD-TBX001, SD-TBH001 |
| [SD-TBY001](data-architecture/SD-TBY001-data-architecture.md) | Data architecture | INTERNAL_REVIEW | RD-TBT001, SD-TBH001 |
| [SD-TBP001](common-policy/SD-TBP001-common-policy.md) | Common policy | INTERNAL_REVIEW | RD-TBT001, SD-TBH001 |
