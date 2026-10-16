/**
 * A Story is the unit of content: "một câu chuyện cần bắt kịp", not "một bài đăng cần đọc".
 * Twenty posts about the same thing resolve to one Story (ADR-0001).
 */

export type StoryStatus = "candidate" | "drafting" | "in_review" | "published" | "archived";

/** Communities the pilot tracks. Extend deliberately: each one needs a source plan. */
export type Community = "meme" | "game" | "tech" | "entertainment" | "sports" | "other";

export type Platform = "threads" | "facebook" | "instagram" | "tiktok" | "youtube" | "x" | "web" | "other";

export interface Story {
  id: string;
  slug: string;
  /** Question-shaped headline: "Sao hôm nay ai cũng dùng câu “…”?" */
  headline: string;
  status: StoryStatus;
  /** Where the story started; drives "ngoài feed" matching against the reader's communities. */
  originCommunity: Community;
  /** Communities where it is currently spreading. */
  spreadingIn: Community[];
  firstSeenAt: string;
  lastActivityAt: string;
  /** Set when the story resurfaces: "Có diễn biến mới". */
  resurfacedAt?: string;
  /** IDs of posts/links clustered into this story. */
  memberPostIds: string[];
}

/** Reader feedback on a story card. Learned inside Toibingu, never from browsing history. */
export type CardFeedback = "tell_me" | "already_know" | "not_interested";

/** Reader feedback on a dossier. */
export type DossierFeedback = "understood" | "still_confused" | "wrong_info";
