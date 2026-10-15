/**
 * Vietnamese text normalisation for pattern matching (SD-TBH001 H-07).
 * Two forms: `accented` keeps diacritics (precise), `folded` strips them (catches "vu gi vay").
 */

/** Common chat spellings, applied on folded text, whole words only. */
const TEEN_CODE: Record<string, string> = {
  ko: "khong", k: "khong", hok: "khong", khum: "khong", hong: "khong",
  j: "gi", z: "vay", v: "vay", dc: "duoc", ng: "nguoi", mn: "moi nguoi", mng: "moi nguoi",
  t: "toi", tui: "toi", bt: "biet", vs: "voi", ae: "anh em", nao: "nao",
};

export interface NormalizedText {
  accented: string;
  folded: string;
}

const squash = (s: string): string =>
  s.replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();

export function fold(text: string): string {
  return text.normalize("NFD").replace(/\p{M}/gu, "").replace(/đ/g, "d").replace(/Đ/g, "D");
}

export function normalize(text: string): NormalizedText {
  const accented = squash(text.normalize("NFC").toLowerCase());
  const folded = fold(accented)
    .split(" ")
    .map((w) => TEEN_CODE[w] ?? w)
    .join(" ");
  return { accented, folded };
}
