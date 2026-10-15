/**
 * Context need for one story, 0..1, the `contextNeed` input of `priority()` in @toibingu/domain.
 * Weights and caps are pilot hypotheses (RD-TBT001 §9); tune against labelled data.
 */
export interface ContextNeedInput {
  /** Distinct devices / authors that asked about this story in the window (never raw request count). */
  independentRequesters: number;
  /** Card taps: "Kể tôi nghe" ÷ all three buttons. */
  tellMeRate: number;
  /** Dossier taps: "Vẫn chưa hiểu" ÷ ("Hiểu rồi" + "Vẫn chưa hiểu"). */
  stillConfusedRate: number;
}

export const CONTEXT_NEED_CONFIG = {
  /** Requesters at which the requester term saturates. */
  requesterCap: 50,
  weights: { requesters: 0.6, tellMe: 0.25, stillConfused: 0.15 },
} as const;

const clamp01 = (n: number): number => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0);

export function contextNeed(input: ContextNeedInput): number {
  const { requesterCap, weights } = CONTEXT_NEED_CONFIG;
  const requesters = Math.max(0, input.independentRequesters);
  const requesterTerm = clamp01(Math.log1p(requesters) / Math.log1p(requesterCap));
  return clamp01(
    weights.requesters * requesterTerm +
      weights.tellMe * clamp01(input.tellMeRate) +
      weights.stillConfused * clamp01(input.stillConfusedRate),
  );
}
