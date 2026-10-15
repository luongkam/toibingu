import type { Community, Platform } from "./story.ts";

/**
 * "Đang được bàn tán ≠ đã được xác nhận ≠ đáng tin."
 * A rumour can be the subject of a dossier, but must be labelled as such.
 * Share counts never upgrade a claim's status.
 */
export type ClaimStatus =
  /** Đang lan truyền — chưa xác minh. */
  | "circulating"
  /** Có nguồn xác nhận. */
  | "confirmed"
  /** Nguồn mâu thuẫn nhau. */
  | "disputed"
  /** Đã bị bác bỏ. */
  | "debunked";

export interface Source {
  id: string;
  url: string;
  platform: Platform;
  title?: string;
  publishedAt?: string;
  retrievedAt: string;
  /** Content from private groups never becomes a public dossier source (ADR-0003). */
  visibility: "public" | "private";
  /** How the source was obtained; scraping is not an allowed value by design. */
  accessMethod: "official_api" | "user_submitted" | "editor_added";
}

export interface Claim {
  id: string;
  text: string;
  status: ClaimStatus;
  sourceIds: string[];
}

export interface TimelineEvent {
  /** When it happened. */
  happenedAt?: string;
  /** When it became publicly known. Kept separate on purpose. */
  knownAt?: string;
  text: string;
  sourceIds: string[];
}

export interface DecoderEntry {
  /** Nickname, catchphrase or meme as people actually write it. */
  phrase: string;
  meaning: string;
  sourceIds: string[];
}

/** Explanations from the community: link back to the original, never copy wholesale. */
export interface CommunityExplanation {
  sourceId: string;
  /** Short excerpt within quotation limits; the full text stays at the source. */
  excerpt: string;
  /** Selected by an editor; like count alone never qualifies an explanation. */
  selectedBy: string;
}

/**
 * Hồ sơ bắt kịp — the core asset. The default view must be enough for "À, ra thế."
 */
export interface CatchUpDossier {
  storyId: string;
  /** Hiểu nhanh: rốt cuộc đây là chuyện gì? */
  quickTake: string;
  /** Đoạn bạn bỏ lỡ: điều gì xảy ra trước đó? */
  missedPart: string;
  /** Vì sao đang hot: phát ngôn mới, bản chế mới, hay chuyện cũ bị đào lại? */
  whyHotNow: string;
  /** Hot ở đâu. Label scope honestly: "trong các nguồn Toibingu theo dõi". */
  whereHot: { community: Community; platforms: Platform[] }[];
  /** Giải mã cách mọi người nói. */
  decoder: DecoderEntry[];
  /** Diễn biến. */
  timeline: TimelineEvent[];
  claims: Claim[];
  sources: Source[];
  /** Toibingu's own explanation lives in the fields above; community voices stay separate. */
  communityExplanations: CommunityExplanation[];
  compiledAt: string;
  updatedAt: string;
  /** Editor who approved this revision; null while drafting. */
  approvedBy: string | null;
}
