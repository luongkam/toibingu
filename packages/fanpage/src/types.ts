/**
 * Page "Tôi bị ngu" auto-replies (RD-TBT001 REQ-018). Only comments on the Page's OWN posts can be answered:
 * Meta gives no signal for comments elsewhere and no way to check who follows the Page (SD-TBI001 I-11).
 */

/** A `feed` webhook comment event on one of our posts, already parsed by the adapter. */
export interface CommentEvent {
  commentId: string;
  postId: string;
  /** Page-scoped id of the commenter when Meta sends it; used to dedupe and to @mention. */
  fromId?: string;
  /** True when the comment was written by the Page itself (never answer ourselves). */
  fromPage: boolean;
  message: string;
  createdAt: string;
}

/** Each Page post is bound to one story; only a published, approved dossier may be quoted. */
export interface PostBinding {
  postId: string;
  storyId: string;
  /** Public dossier URL, e.g. https://toibingu.vn/vu/<slug>. */
  dossierUrl: string;
  quickTake: string;
  published: boolean;
}

export interface ReplyState {
  /** `${postId}:${fromId}` pairs already answered. */
  answered: Set<string>;
  /** Comment ids already answered (dedupe when fromId is missing). */
  answeredComments: Set<string>;
  /** Reply timestamps per post, for the hourly cap. */
  repliesByPost: Map<string, number[]>;
}

export const newReplyState = (): ReplyState => ({ answered: new Set(), answeredComments: new Set(), repliesByPost: new Map() });

export type SkipReason =
  | "not_trigger"
  | "from_page"
  | "already_answered"
  | "post_not_bound"
  | "dossier_not_published"
  | "post_rate_limited";

export type ReplyDecision =
  | { action: "reply"; commentId: string; at: string; text: string; mentionId?: string }
  | { action: "skip"; commentId: string; reason: SkipReason };
