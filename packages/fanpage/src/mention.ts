/**
 * Tag path: someone writes "@Tôi bị ngu" under a post the Page does not own (RD-TBT001 REQ-018, T2).
 * Meta sends a `mention` webhook (comment text, post id, comment id; no commenter id), but documents no right to
 * comment on posts the Page does not moderate. So replies stay OFF until a pilot confirms Meta accepts them
 * (`capability: "confirmed"`); the adapter flips it to "denied" on the first permission error. Every tag is still
 * counted as demand for the matched story (REQ-009 layer 2).
 */
import { composeReply, DISCLOSURE, seed } from "./compose.ts";
import type { PostBinding } from "./types.ts";

export type MentionCapability = "unknown" | "confirmed" | "denied";

export interface MentionEvent {
  commentId?: string;
  postId: string;
  message: string;
  createdAt: string;
}

export interface MentionState {
  answeredComments: Set<string>;
  replies: number[];
  /** Demand per story id, or per raw post id when no story matched. */
  demand: Map<string, number>;
}

export const newMentionState = (): MentionState => ({ answeredComments: new Set(), replies: [] , demand: new Map() });

export const MENTION_CONFIG = { maxRepliesPerHour: 60, minDelaySec: 120, maxDelaySec: 600 } as const;

export type MentionDecision =
  | { action: "reply"; commentId: string; at: string; text: string; storyId?: string }
  | {
      action: "count_only";
      reason: "capability_unknown" | "capability_denied" | "no_comment_id" | "already_answered" | "rate_limited";
      storyId?: string;
    };

const HOUR = 3600 * 1000;

/** "Chưa có hồ sơ" reply that turns the tag into a Messenger opt-in instead of a dead end. */
export function composeNoDossierReply(commentId: string, messengerUrl: string): string {
  const lines = [
    "Vụ này Toibingu chưa có hồ sơ, mình đã ghi nhận bạn hỏi.",
    "Chưa kịp soạn tập 1 cho vụ này, mình đã ghi lại rồi.",
  ];
  return `${lines[seed(commentId) % lines.length]} Nhắn Page để được báo khi có: ${messengerUrl} ${DISCLOSURE}`;
}

export function decideMention(
  e: MentionEvent,
  match: PostBinding | undefined,
  capability: MentionCapability,
  state: MentionState,
  messengerUrl: string,
): MentionDecision {
  const key = match?.published ? match.storyId : `post:${e.postId}`;
  state.demand.set(key, (state.demand.get(key) ?? 0) + 1);
  const storyId = match?.published ? { storyId: match.storyId } : {};
  const count = (reason: Extract<MentionDecision, { action: "count_only" }>["reason"]): MentionDecision => ({ action: "count_only", reason, ...storyId });

  if (capability === "unknown") return count("capability_unknown");
  if (capability === "denied") return count("capability_denied");
  if (!e.commentId) return count("no_comment_id");
  if (state.answeredComments.has(e.commentId)) return count("already_answered");
  const created = new Date(e.createdAt).getTime();
  const span = MENTION_CONFIG.maxDelaySec - MENTION_CONFIG.minDelaySec;
  const at = created + (MENTION_CONFIG.minDelaySec + (seed(e.commentId) % (span + 1))) * 1000;
  state.replies = state.replies.filter((t) => at - t < HOUR);
  if (state.replies.length >= MENTION_CONFIG.maxRepliesPerHour) return count("rate_limited");

  state.answeredComments.add(e.commentId);
  state.replies.push(at);
  const text = match?.published
    ? composeReply({ commentId: e.commentId, quickTake: match.quickTake, dossierUrl: match.dossierUrl, refCode: `fbtag-${match.storyId}` })
    : composeNoDossierReply(e.commentId, messengerUrl);
  return { action: "reply", commentId: e.commentId, at: new Date(at).toISOString(), text, ...storyId };
}
