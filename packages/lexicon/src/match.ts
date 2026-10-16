/**
 * Finds lexicon terms inside free text (intake, posts). Longest match wins; matches do not overlap.
 */
import { fold, normalize } from "@toibingu/signals";
import type { Term } from "./term.ts";

interface Pattern {
  termId: string;
  words: string[];
  accented: boolean;
}

function patterns(terms: readonly Term[]): Pattern[] {
  const out: Pattern[] = [];
  for (const t of terms) {
    for (const v of new Set([t.display, ...t.variants])) {
      const n = normalize(v);
      const form = t.accentedOnly ? n.accented : n.folded;
      if (form) out.push({ termId: t.id, words: form.split(" "), accented: Boolean(t.accentedOnly) });
    }
  }
  return out.sort((a, b) => b.words.length - a.words.length);
}

export function findTerms(text: string, terms: readonly Term[]): string[] {
  const n = normalize(text);
  const streams = { accented: n.accented.split(" "), folded: n.folded.split(" ") };
  const taken = new Set<number>();
  const found: string[] = [];
  for (const p of patterns(terms)) {
    const words = p.accented ? streams.accented : streams.folded;
    for (let i = 0; i + p.words.length <= words.length; i++) {
      const span = p.words.map((_, k) => i + k);
      if (span.some((k) => taken.has(k))) continue;
      if (p.words.every((w, k) => words[i + k] === w)) {
        span.forEach((k) => taken.add(k));
        if (!found.includes(p.termId)) found.push(p.termId);
      }
    }
  }
  return found;
}

/** ASCII slug for a term id: "Tối cổ" → "toi-co". */
export function slugify(display: string): string {
  return fold(display.normalize("NFC").toLowerCase())
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
