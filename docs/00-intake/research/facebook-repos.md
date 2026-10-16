# Research — GitHub repos làm việc với Facebook (2026-10-16)

> HISTORICAL input cho REQ-018. Câu hỏi: có repo nào làm được "tag/comment 'Tôi bị ngu' ở bài bất kỳ → bot trả lời"? Repo pages mở qua web; ngày commit cuối nhiều repo không xem được (n/v). **UNVERIFIED** = chưa xác minh.

## Kết luận
- **Không repo công khai nào làm trọn "tag/comment ở bất kỳ đâu → tự trả lời".** Họ fca/fbchat/Goat/Mirai chỉ làm Messenger; scraper chỉ đọc; bot trình duyệt chỉ comment vào mục tiêu cố định.
- **Tự ghép được bằng đường không chính thức** (cookie session + poll trang thông báo / GraphQL riêng + comment bằng tài khoản đó), nhưng: hay vỡ (DOM, `fb_dtsg`, doc_id đổi), bot detection siết (fbchat #675), mọi README cảnh báo khóa tài khoản; vi phạm Điều khoản Meta §3.2.3 và §3.1; Meta đã thắng kiện về §3.2.3 (*Meta v. BrandTotal*, 2022; *Meta v. Voyager Labs*, 2023); Nghị định 147/2024 buộc tài khoản đăng/bình luận gắn số điện thoại thật; trao appState cho fork npm = trao phiên đăng nhập (đã có fork bị gắn cờ mã độc).
- **Quyết định:** không dùng đường không chính thức (bất biến "không cào", SD-TBI001 I-07, I-12). Dùng: comment dưới bài của Page (T1), Messenger (T3), Instagram mentions (T4), Threads mentions (T5); thử Page `mention` + trả lời ở dev mode (T2, UNVERIFIED).

## Bảng repo
| Repo | Loại | Làm được gì cho bài toán | Tình trạng | Dấu hiệu vỡ / khóa | Rủi ro điều khoản |
|---|---|---|---|---|---|
| facebook/facebook-python-business-sdk | Chính thức | Wrapper Graph API; trả lời nơi token Page được phép | ~1.6k★, không archived | — | Thấp |
| facebook/facebook-nodejs-business-sdk | Chính thức | Như trên (Node) | 622★ | — | Thấp |
| mobolic/facebook-sdk | Wrapper Graph API | Client mỏng | ~2.8k★, Apache-2.0 | — | Thấp |
| fbsamples/messenger-platform-samples | Chính thức | Mẫu bot Messenger cho Page | 1.8k★ | — | Thấp |
| fbsamples/graph-api-webhooks-samples | Chính thức | Mẫu webhook feed / IG / Threads | 310★, **archived 2026-04-01** | — | Thấp |
| Yoctol/bottender | Framework (API chính thức) | Bot Messenger cho Page | 4.3k★, MIT | — | Thấp |
| howdyai/botkit | Framework | Adapter Messenger | **archived 2024-09-20** | — | Thấp |
| kevinzg/facebook-scraper | Scraper không chính thức | Đọc bài, comment; **không đăng, không đọc thông báo** | 3.3k★, commit cuối 2023-10-30 | #1116, #1119, #1130: không còn chạy; README: có thể bị chặn IP | Cao (§3.2.3) |
| fbchat-dev/fbchat | Không chính thức, tài khoản cá nhân | Chỉ Messenger | **unmaintained** | #674, #675 (bot detection) | Cao |
| Schmavery/facebook-chat-api | Không chính thức (appState) | Chỉ Messenger | **archived 2022-07-09** | #852 khóa tài khoản | Cao |
| NethWs3Dev/ws3-fca | Fork fca | Messenger; README nói có comment/reply bài công khai; không có nghe thông báo | 8★ | không cảnh báo khóa (dấu hiệu xấu) | Cao |
| ntkhang03/Goat-Bot-V2 (VN) | Bot Messenger tài khoản cá nhân | Lệnh trong nhóm Messenger | **archived 2024-09-25** | README: dùng "clone account", có thể bị khóa | Cao |
| fca forks / Mirai | Fork npm | Messenger | rải rác | `fca-horizon-remaster` bị gắn cờ mã độc (Vulert) | Cao + lộ cookie |
| Bot Selenium/Playwright (vd. shuhanmirza/facebook_comment_automation) | Tự động hóa trình duyệt | Comment vào bài mới nhất của 1 người cố định | nhỏ | — | Cao |
| Apify Facebook Comments Scraper | SaaS scraper | Chỉ đọc comment | trả phí | — | Cao |

## Nguồn pháp lý
- Meta Terms §3.1, §3.2.3: https://www.facebook.com/legal/terms
- Meta v. BrandTotal: https://www.courthousenews.com/judge-rules-brandtotals-data-harvesting-violates-metas-terms-of-use-and-anti-hacking-laws/
- Meta v. Voyager Labs: https://www.mediapost.com/publications/article/401661/
- Nghị định 147/2024/NĐ-CP, Điều 23(3)(e): https://luatvietnam.vn/tin-van-ban-moi/tu-25-12-2024-tai-khoan-mang-xa-hoi-da-xac-thuc-bang-so-dien-thoai-moi-duoc-dang-bai-186-99855-article.html
