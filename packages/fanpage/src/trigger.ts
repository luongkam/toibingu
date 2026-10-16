/** The ritual: a comment containing "Tôi bị ngu" (any spelling the lexicon knows) asks the Page to explain. */
import { findTerms, type Term } from "@toibingu/lexicon";
import { detectContextRequest } from "@toibingu/signals";

export const TRIGGER_TERM_ID = "toi-bi-ngu";

export function isTrigger(message: string, lexicon: readonly Term[]): boolean {
  return findTerms(message, lexicon).includes(TRIGGER_TERM_ID) || detectContextRequest(message).kinds.includes("toi_bi_ngu");
}
