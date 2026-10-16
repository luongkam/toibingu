/**
 * Detects "context requests": people asking for the missing episode (RD-TBT001 REQ-009, layer 2).
 * Matching on folded text catches unaccented chat ("vu gi vay"); phrases that become ambiguous once
 * folded ("tối cổ" vs "tôi có") match only on accented text.
 */
import { extractAskedTerms } from "./asked-terms.ts";
import { normalize } from "./normalize.ts";

export type ContextRequestKind =
  | "what_happened"
  | "summary_please"
  | "source_please"
  | "missed_part"
  | "why_everyone"
  | "explain_please"
  | "toi_bi_ngu"
  /** "X là gì (vậy)?": the most common way to ask for the missing episode. */
  | "what_is";

interface Rule {
  kind: ContextRequestKind;
  /** Pattern on folded text (no diacritics, teen code expanded). */
  folded?: RegExp;
  /** Pattern on accented text, for phrases that are ambiguous once folded. */
  accented?: RegExp;
}

const RULES: Rule[] = [
  { kind: "what_happened", folded: /\b(vu|chuyen|drama|bien|bien co) gi( (vay|the|day|do))?\b|\bco (bien|drama|chuyen) gi\b/ },
  { kind: "summary_please", folded: /\b(ai|nho|xin) tom tat\b|\btom tat (giup|ho|voi|cai)\b|\btl ?dr\b/ },
  { kind: "source_please", folded: /\bxin (nguon|link|cap|context|info)\b|\bnguon (o )?dau\b/ },
  { kind: "missed_part", folded: /\bbo lo (doan|tap|chuyen|gi|cai gi)\b|\blo mat (doan|tap)\b/, accented: /(?<!\p{L})(hội )?tối cổ(?!\p{L})/u },
  { kind: "why_everyone", folded: /\bsao (moi nguoi|ai cung|ca lang|ca mang|nhieu nguoi) (cuoi|noi|nhac|dung|share|chia se)\b|\b(trend|meme|cau) (nay )?(la )?gi( vay)?\b/ },
  { kind: "explain_please", folded: /\b(ai|nho) giai thich\b|\bgiai thich (ho|giup|voi)\b|\bthong nao\b|\bkhai sang (giup|ho|voi|cho)\b/ },
  { kind: "toi_bi_ngu", folded: /\b(toi|minh|em|anh|chi) bi ngu\b/ },
];

export interface ContextRequestMatch {
  isRequest: boolean;
  kinds: ContextRequestKind[];
}

export function detectContextRequest(text: string): ContextRequestMatch {
  const { accented, folded } = normalize(text);
  const kinds = RULES.filter(
    (r) => (r.folded?.test(folded) ?? false) || (r.accented?.test(accented) ?? false),
  ).map((r) => r.kind);
  if (extractAskedTerms(text).length > 0) kinds.push("what_is");
  return { isRequest: kinds.length > 0, kinds };
}
