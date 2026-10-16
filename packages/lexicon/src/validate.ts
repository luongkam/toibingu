/**
 * Lexicon data rules, run by tests over data/lexicon (SD-TBY001, SD-TBP001 P-08).
 */
import { normalize } from "@toibingu/signals";
import type { Term } from "./term.ts";

const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const METHODS = new Set(["official_api", "user_submitted", "editor_added"]);

export function validateLexicon(terms: readonly Term[]): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const folded = new Map<string, string>();
  for (const t of terms) {
    const at = `term ${t.id}`;
    if (!ID.test(t.id)) errors.push(`${at}: id must be an ASCII slug`);
    if (ids.has(t.id)) errors.push(`${at}: duplicate id`);
    ids.add(t.id);
    if (!t.display.trim()) errors.push(`${at}: display is empty`);
    if (!t.meaning.trim() || t.meaning.length > 200) errors.push(`${at}: meaning must be 1..200 chars`);
    if (t.review === "approved" && !t.approvedBy) errors.push(`${at}: approved needs approvedBy`);
    if (t.review !== "approved" && t.approvedBy) errors.push(`${at}: approvedBy set but review is ${t.review}`);
    if (t.kind !== "brand" && t.review === "approved" && t.sources.length === 0) {
      errors.push(`${at}: an approved non-brand term needs at least one source`);
    }
    for (const s of t.sources) {
      if (!METHODS.has(s.accessMethod)) errors.push(`${at}: source accessMethod ${s.accessMethod} not allowed`);
      if (!/^https:\/\//.test(s.url)) errors.push(`${at}: source url must be https`);
    }
    for (const v of [t.display, ...t.variants]) {
      const key = t.accentedOnly ? `a:${normalize(v).accented}` : `f:${normalize(v).folded}`;
      const owner = folded.get(key);
      if (owner && owner !== t.id) errors.push(`${at}: variant "${v}" collides with term ${owner}`);
      folded.set(key, t.id);
    }
  }
  return errors;
}
