/**
 * Decides whether and when the Page answers a comment. Pure: the adapter executes the decision later.
 * "1 lúc sau": the reply is scheduled 2 to 10 minutes after the comment, fixed per comment.
 */
import type { Term } from "@toibingu/lexicon";
import { composeReply, seed } from "./compose.ts";
import { isTrigger } from "./trigger.ts";
import type { CommentEvent, PostBinding, ReplyDecision, ReplyState } from "./types.ts";

export const REPLY_CONFIG = {
  minDelaySec: 120,
  maxDelaySec: 600,
  maxRepliesPerPostPerHour: 30,
} as const;

const HOUR = 3600 * 1000;

export function decideReply(
  e: CommentEvent,
  binding: PostBinding | undefined,
  state: ReplyState,
  lexicon: readonly Term[],
): ReplyDecision {
  const skip = (reason: Extract<ReplyDecision, { action: "skip" }>["reason"]): ReplyDecision => ({ action: "skip", commentId: e.commentId, reason });
  if (e.fromPage) return skip("from_page");
  if (!isTrigger(e.message, lexicon)) return skip("not_trigger");
  if (!binding) return skip("post_not_bound");
  if (!binding.published) return skip("dossier_not_published");
  const pair = e.fromId ? `${e.postId}:${e.fromId}` : undefined;
  if (state.answeredComments.has(e.commentId) || (pair && state.answered.has(pair))) return skip("already_answered");

  const created = new Date(e.createdAt).getTime();
  const span = REPLY_CONFIG.maxDelaySec - REPLY_CONFIG.minDelaySec;
  const at = created + (REPLY_CONFIG.minDelaySec + (seed(e.commentId) % (span + 1))) * 1000;
  const recent = (state.repliesByPost.get(e.postId) ?? []).filter((t) => at - t < HOUR);
  if (recent.length >= REPLY_CONFIG.maxRepliesPerPostPerHour) return skip("post_rate_limited");

  state.answeredComments.add(e.commentId);
  if (pair) state.answered.add(pair);
  state.repliesByPost.set(e.postId, [...recent, at]);
  return {
    action: "reply",
    commentId: e.commentId,
    at: new Date(at).toISOString(),
    text: composeReply({ commentId: e.commentId, quickTake: binding.quickTake, dossierUrl: binding.dossierUrl, refCode: `fb-${binding.storyId}` }),
    ...(e.fromId ? { mentionId: e.fromId } : {}),
  };
}
