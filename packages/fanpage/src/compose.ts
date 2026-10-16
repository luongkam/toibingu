/**
 * Reply text. Varied openers (identical link comments at volume are a spam signal, Meta Community Standards),
 * real information in one sentence, a tracked link, and an automation disclosure. Self-deprecating voice only
 * about ourselves (SD-TBP001 P-04).
 */
export const OPENERS = [
  "Bạn không ngu. Bạn thiếu tập 1. Đây là tập 1:",
  "Không sao, ai cũng có lúc tối cổ. Tóm lại là:",
  "Thông não nhanh cho bạn đây:",
  "Tập trước bạn lỡ mất nè:",
] as const;

export const DISCLOSURE = "(Trả lời tự động)";
export const MAX_QUICK_TAKE = 280;

/** Stable small hash so the same comment always gets the same opener and delay (testable, no randomness). */
export function seed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

const clip = (s: string, n: number): string => (s.length <= n ? s : `${s.slice(0, n - 1).trimEnd()}…`);

export function composeReply(p: { commentId: string; quickTake: string; dossierUrl: string; refCode: string }): string {
  const opener = OPENERS[seed(p.commentId) % OPENERS.length]!;
  const url = new URL(p.dossierUrl);
  url.searchParams.set("ref", p.refCode);
  return `${opener} ${clip(p.quickTake.trim(), MAX_QUICK_TAKE)} Đọc đủ: ${url.toString()} ${DISCLOSURE}`;
}
