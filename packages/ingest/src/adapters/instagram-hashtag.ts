/**
 * Instagram hashtag search (SD-TBI001 IF-09): `instagram_basic` + Instagram Public Content Access on an IG
 * Business/Creator account. Limit: 30 unique hashtags per rolling 7 days; `recent_media` covers 24 hours.
 */
import { graphStatus } from "../graph-errors.ts";
import type { UniqueKeyQuota } from "../quota.ts";
import type { AdapterResult, FetchLike, IngestItem } from "../types.ts";
import { officialSource, result } from "../types.ts";

export interface InstagramConfig {
  accessToken?: string;
  igUserId?: string;
  quota: UniqueKeyQuota;
  /** Graph API version, e.g. "v23.0"; keep in env so an upgrade needs no code change. */
  graphVersion: string;
}

/** Instagram hashtags: no leading #, no spaces; lower-cased so the 30-tag budget is not wasted on case. */
export function cleanHashtag(tag: string): string {
  return tag.replace(/^#/, "").replace(/\s+/g, "").toLowerCase();
}

export async function searchInstagramHashtag(fetch: FetchLike, cfg: InstagramConfig, rawTag: string, now = new Date()): Promise<AdapterResult> {
  const name = "instagram-hashtag";
  if (!cfg.accessToken || !cfg.igUserId) return result(name, "not_configured", [], ["no Instagram token or IG user id"]);
  const tag = cleanHashtag(rawTag);
  if (!tag) return result(name, "degraded", [], ["empty hashtag"]);
  if (!cfg.quota.take(tag, now.getTime())) return result(name, "quota_exhausted", [], ["30 unique hashtags / 7 days reached"]);
  const base = `https://graph.facebook.com/${cfg.graphVersion}`;
  const auth = `user_id=${encodeURIComponent(cfg.igUserId)}&access_token=${encodeURIComponent(cfg.accessToken)}`;
  try {
    const idRes = await fetch(`${base}/ig_hashtag_search?q=${encodeURIComponent(tag)}&${auth}`);
    const idBody = await idRes.text();
    const idErr = graphStatus(idRes.status, idBody);
    if (idErr) return result(name, idErr.status, [], [idErr.message]);
    const hashtagId = (JSON.parse(idBody) as { data?: { id: string }[] }).data?.[0]?.id;
    if (!hashtagId) return result(name, "ok", [], [`no hashtag id for #${tag}`]);
    const mRes = await fetch(`${base}/${hashtagId}/recent_media?fields=id,caption,permalink,timestamp&${auth}`);
    const mBody = await mRes.text();
    const mErr = graphStatus(mRes.status, mBody);
    if (mErr) return result(name, mErr.status, [], [mErr.message]);
    const at = now.toISOString();
    const items: IngestItem[] = ((JSON.parse(mBody) as { data?: { id: string; caption?: string; permalink?: string; timestamp?: string }[] }).data ?? [])
      .filter((d) => d.caption && d.permalink)
      .map((d) => ({
        externalId: d.id,
        text: d.caption!,
        url: d.permalink!,
        platform: "instagram",
        ...(d.timestamp ? { publishedAt: new Date(d.timestamp).toISOString() } : {}),
        source: officialSource("instagram", d.id, d.permalink!, at),
        meta: { hashtag: tag },
      }));
    return result(name, "ok", items);
  } catch (e) {
    return result(name, "degraded", [], [`network: ${(e as Error).message}`]);
  }
}
