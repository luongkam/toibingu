/**
 * Điều kiện xuất bản = đủ nguồn và đạt yêu cầu kiểm duyệt.
 * Deliberately takes no engagement metrics: virality cannot open this gate (ADR-0004).
 */
import type { CatchUpDossier } from "./dossier.ts";

export type GateFailure =
  | { code: "missing_section"; section: "quickTake" | "missedPart" | "whyHotNow" }
  | { code: "no_sources" }
  | { code: "confirmed_claim_without_source"; claimId: string }
  | { code: "dangling_source_ref"; sourceId: string }
  | { code: "private_source"; sourceId: string }
  | { code: "not_approved" };

export interface GateResult {
  ok: boolean;
  failures: GateFailure[];
}

export function checkPublishGate(d: CatchUpDossier): GateResult {
  const failures: GateFailure[] = [];

  for (const section of ["quickTake", "missedPart", "whyHotNow"] as const) {
    if (d[section].trim() === "") failures.push({ code: "missing_section", section });
  }

  if (d.sources.length === 0) failures.push({ code: "no_sources" });

  const known = new Set(d.sources.map((s) => s.id));
  const refs = [
    ...d.claims.flatMap((c) => c.sourceIds),
    ...d.timeline.flatMap((t) => t.sourceIds),
    ...d.decoder.flatMap((e) => e.sourceIds),
    ...d.communityExplanations.map((e) => e.sourceId),
  ];
  for (const id of new Set(refs)) {
    if (!known.has(id)) failures.push({ code: "dangling_source_ref", sourceId: id });
  }

  for (const c of d.claims) {
    if (c.status === "confirmed" && c.sourceIds.length === 0) {
      failures.push({ code: "confirmed_claim_without_source", claimId: c.id });
    }
  }

  for (const s of d.sources) {
    if (s.visibility === "private") failures.push({ code: "private_source", sourceId: s.id });
  }

  if (d.approvedBy === null) failures.push({ code: "not_approved" });

  return { ok: failures.length === 0, failures };
}
