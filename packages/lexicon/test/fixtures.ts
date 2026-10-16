import type { Term } from "../src/term.ts";

export const term = (over: Partial<Term> & Pick<Term, "id" | "display">): Term => ({
  variants: [],
  kind: "slang",
  meaning: "nghĩa",
  communities: ["meme"],
  platforms: ["threads"],
  firstSeenAt: "2026-10-01",
  review: "pending",
  approvedBy: null,
  sources: [],
  ...over,
});

export const LEX: Term[] = [
  term({ id: "toi-co", display: "tối cổ", accentedOnly: true }),
  term({ id: "hoi-toi-co", display: "Hội tối cổ", kind: "brand", accentedOnly: true }),
  term({ id: "thong-nao", display: "thông não", variants: ["thong nao"] }),
  term({ id: "thanh-thong-nao", display: "Thánh thông não", kind: "brand" }),
  term({ id: "toi-bi-ngu", display: "tôi bị ngu", variants: ["t bị ngu", "tui bị ngu"], kind: "catchphrase" }),
];
