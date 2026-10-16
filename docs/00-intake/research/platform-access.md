# Platform access plan (2026-10-16)

> Input for SD-TBI001 and plan `plans/261016-0900-trend-engine-sources`. Researched from official developer docs on 2026-10-16; **UNVERIFIED** = not confirmed. Only officially permitted access; no scraping, no third-party "API" wrappers, no borrowed academic access, no extra accounts to multiply quota.

## Access table
| Platform | Path | Permission / scope | What we get | Eligible | Review | Limits | Source |
|---|---|---|---|---|---|---|---|
| Threads | Meta app, "Access the Threads API" | `threads_basic` | Our profile, posts | Yes | App Review | 4800 × impressions calls/24h | developers.facebook.com/docs/threads/overview |
| Threads | same | **`threads_keyword_search`** | Public posts by keyword or topic tag (`search_mode=TAG`), `TOP`/`RECENT`, ≤ 100/page | Yes | Advanced Access (else own posts only) | **2.200 queries / user / 24h**, across apps; empty results not counted | developers.facebook.com/docs/threads/keyword-search |
| Threads | same | `threads_profile_discovery` | Public profiles (18+, ≥ 100 followers) and their posts | Yes | Advanced Access | 1.000 req/24h | developers.facebook.com/docs/threads/threads-profiles |
| Threads | same | `threads_manage_mentions` | Public posts mentioning @toibingu | Yes | Advanced Access | — | developers.facebook.com/docs/threads/threads-mentions |
| Threads | same | `threads_read_replies`, `threads_manage_replies` | Read/answer "vụ gì vậy?" replies on our own threads | Yes | App Review | 1.000 replies/24h | developers.facebook.com/docs/permissions |
| Threads | same | `threads_manage_insights`, `threads_content_publish`, `threads_delete`, `threads_location_tagging`, `threads_share_to_instagram` | Our metrics; publish explainers | Yes | App Review | 250 posts, 100 deletes /24h | overview |
| Instagram | Graph API hashtag search | `instagram_basic` + "Instagram Public Content Access" (IG Business/Creator account) | `top_media`, `recent_media` (last 24h) | Yes | App Review | **30 unique hashtags / 7 days** | developers.facebook.com/docs/instagram-platform/…/hashtag-search |
| Facebook | Graph API "Page Public Content Access" | feature PPCA | Posts/comments of public Pages | Possible (odds UNVERIFIED) | App Review + Business Verification | — | developers.facebook.com/docs/features-reference/page-public-content-access |
| Facebook | Graph API, own Page | `pages_read_engagement`, `pages_read_user_content` | Comments on our Page | Yes | App Review | — | permissions |
| TikTok | API for Business, Organic API, **Discovery** | `/discovery/trending_list/`, `/discovery/detail/`; keywords need `discovery.search.words` | Top hashtags, tracks, keywords per `country_code`, 1/7/30/120 days | Likely (Ads + Business account); **VN coverage UNVERIFIED** | Developer app approval | UNVERIFIED | business-api.tiktok.com/portal/docs |
| TikTok | Creative Center web UI | — | Trending hashtags by country | Editor browsing by hand only (ToS §5 bans automated collection); VN UNVERIFIED | — | — | ads.tiktok.com/help/article/creative-center |
| YouTube | Data API v3 | `videos.list chart=mostPopular regionCode=VN` | **Only Music/Movies/Gaming charts since 2025-07-21** | Yes | No | 10.000 units/day; `search.list` 100 calls/day since 2026-06-01 | developers.google.com/youtube/v3/revision_history |
| Google Trends | RSS | `https://trends.google.com/trending/rss?geo=VN` | Trending searches + `approx_traffic` + news links | Yes | No | Poll every 15–30 min; HTTP 200 on 2026-10-16; old `/trends/trendingsearches/daily/rss` is 404 | — |
| Google Trends | Trends API (alpha) | — | Scaled search interest, 5 years | Apply | Alpha selection | — | developers.google.com/search/apis/trends |
| Apple Music | RSS | `rss.marketingtools.apple.com/api/v2/vn/music/most-played/…` | VN top songs (music trend context) | Yes | No | — | — |

**YouTube policy (developer policies, updated 2026-10-15):** non-authorized data kept ≤ 30 days (III.E.4); **no derived metrics** (III.E.4.h); no aggregation across content owners (III.E.2); exception only for audited analytics developers (III.L). Consequence: YouTube data never feeds heat or ranking unless III.L is granted.

## Not available / do not do
- TikTok Research API, Meta Content Library: academic / not-for-profit only. CrowdTangle: shut down 2024-08-14.
- Scraping Creative Center JSON, Apify actors, unofficial TikTok/Threads wrappers.
- `threads_business_basic` (ads only; consumer apps prohibited).
- Fake or extra accounts to multiply Threads quota.
- X (pay per use) and Reddit (commercial needs a signed agreement): skipped for now.
- Zalo OA API: own followers only, no public content (UNVERIFIED). Forums (Voz…): user/editor submissions only.

## Apply now (owner, in order)
1. **Meta Business Portfolio + Business Verification** (Vietnamese business registration certificate; legal name, address, phone matching exactly; verify domain).
2. **Meta app, Threads:** `threads_basic`, `threads_keyword_search`, `threads_profile_discovery`, `threads_manage_mentions`, `threads_read_replies`, `threads_manage_replies`, `threads_manage_insights`, `threads_content_publish`. Needs privacy policy, terms, data-deletion URL, one screencast per permission. Use-case wording: "Toibingu editors, signed in with their own Threads account, search public posts by keyword and topic tag to find stories Vietnamese users are asking about, then publish sourced explainers and reply to those posts." Avoid "scraping", "monitoring people", "reselling data", "AI training". Quota is per user: each real editor sign-in brings its own.
3. **Instagram:** `instagram_basic` + Instagram Public Content Access on an IG Business account; spend the 30 hashtags/week on top Vietnamese slang tags.
4. **TikTok API for Business:** Vietnamese Ads account + Business account; request Organic API Discovery incl. `discovery.search.words`; first confirm `VN` is in `top_country_list`.
5. **Google:** Cloud project with YouTube Data API v3 (editor search only); apply under III.L only if YouTube statistics are ever needed for heat; submit the Trends API alpha form.
6. **Facebook PPCA:** later, once a working UI exists to show reviewers.
7. **Page "Tôi bị ngu" (REQ-018):** create the Page, connect it to the same Meta app; request `pages_show_list`, `pages_manage_metadata`, `pages_read_engagement`, `pages_read_user_content`, `pages_manage_engagement`, `pages_messaging`, feature **Page Mentioning**, and Business Asset User Profile Access (only if names are needed). Subscribe webhooks `feed`, `mention`, `messages`. Screencast: comment "Tôi bị ngu" under a Page post → automated reply with "(Trả lời tự động)". Pilot check before enabling the tag path: tag the Page from a second test Page under a third Page's public post and record whether `POST /{comment-id}/comments` succeeds.
