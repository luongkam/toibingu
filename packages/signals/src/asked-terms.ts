/**
 * Extracts the term someone asks about: "'ét o ét' là gì vậy?" → "ét o ét" (RD-TBT001 REQ-017).
 * An asked-about term that the lexicon does not know yet is the strongest new-slang signal.
 */

const QUESTION =
  /(?:^|\s)(là gì|là cái gì|nghĩa là gì|có nghĩa là gì|là trend gì|là meme gì|là ai|là sao|la gi|nghia la gi|la trend gi|la ai)(?=\s|$)/u;

/** Leading fillers that are not part of the term. Longest first. */
const FILLERS = [
  "mọi người ơi", "cho mình hỏi", "cho tôi hỏi", "cho em hỏi", "ai biết", "ai giải thích", "tôi bị ngu",
  "mình bị ngu", "cho hỏi", "vậy còn", "thế còn", "còn", "trend", "vụ", "cái", "từ", "chữ", "câu", "cụm", "meme", "thế", "vậy", "rốt cuộc",
];

const MAX_WORDS = 6;

function stripFillers(s: string): string {
  let out = s.trim();
  for (let changed = true; changed; ) {
    changed = false;
    for (const f of FILLERS) {
      if (out === f) return "";
      if (out.startsWith(`${f} `)) {
        out = out.slice(f.length + 1).trim();
        changed = true;
      }
    }
  }
  return out;
}

export function extractAskedTerms(text: string): string[] {
  const found: string[] = [];
  const nfc = text.normalize("NFC");
  // Quoted terms win: "…", “…”, '…', «…».
  for (const m of nfc.matchAll(/["“'‘«]([^"”'’»]{1,60})["”'’»]\s*(?:là|la|nghĩa là|nghia la)\b/giu)) {
    found.push(m[1]!.trim().toLowerCase());
  }
  if (found.length === 0) {
    for (const clause of nfc.toLowerCase().split(/[,.;!?\n]+/)) {
      const c = clause.replace(/\s+/g, " ").trim();
      const m = QUESTION.exec(c);
      if (!m || m.index === undefined) continue;
      const term = stripFillers(c.slice(0, m.index).replace(/[^\p{L}\p{N}\s#@_-]/gu, " ").replace(/\s+/g, " "));
      if (term && term.split(" ").length <= MAX_WORDS) found.push(term);
    }
  }
  return [...new Set(found.filter(Boolean))];
}
