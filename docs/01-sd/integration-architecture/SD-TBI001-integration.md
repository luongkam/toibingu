---
doc_id: SD-TBI001
title: Integration architecture (Kiến trúc tích hợp)
phase: 01-sd
status: INTERNAL_REVIEW
depends_on: [RD-TBT001, SD-TBX001, SD-TBH001]
updated: 2026-10-16
---

# SD-TBI001 Integration architecture

## 1. Purpose

Định nghĩa cách Toibingu tích hợp với từng hệ thống ngoài: mục đích, giao thức, xác thực, giới hạn, chế độ lỗi và phương án dự phòng. Truy vết: RD-TBT001 REQ-003, REQ-007, REQ-009, REQ-010, NFR-05, NFR-08 (`docs/01-rd/RD-REQ/`).

## 2. Scope

Mọi lời gọi ra ngoài ranh giới hệ thống (SD-TBX001). Mọi tích hợp nằm sau một interface trong `packages/ingest` hoặc `packages/dossier-ai`; app không gọi thẳng nhà cung cấp.

## 3. Integration list

| IF | Hệ thống | Hướng | Mục đích | Giao thức / xác thực | Giới hạn đã biết | Khi lỗi | RD |
|---|---|---|---|---|---|---|---|
| IF-01 | Threads keyword search API | Ra | Tìm bài công khai theo từ khóa / topic tag (câu xin bối cảnh, cụm từ đang theo dõi, từ lóng trong lexicon) | HTTPS `graph.threads.net/v1.0/keyword_search`, token OAuth của từng biên tập viên; **cần Advanced Access `threads_keyword_search` + Business Verification** | 2.200 truy vấn / user / 24 giờ; ≤ 100 kết quả / lần; từ khóa nhạy cảm trả rỗng | Bỏ qua chu kỳ, ghi cảnh báo; hệ thống chạy tiếp bằng IF-02, link người dùng, link biên tập | REQ-009 |
| IF-02 | Google Trends RSS (geo VN) | Ra | Tín hiệu truy vấn tìm kiếm đang tăng (bổ sung, không phải bảng xếp hạng mạng xã hội) | HTTPS `https://trends.google.com/trending/rss?geo=VN`, không xác thực; hỏi 15 đến 30 phút một lần | Không chính thức; URL cũ `/trends/trendingsearches/daily/rss` đã 404 (2026-10-16) | Đánh dấu nguồn `degraded`, không chặn pipeline | REQ-009 |
| IF-03 | LLM provider | Ra | Nháp hồ sơ có trích dẫn; OCR ảnh chụp | HTTPS API, khóa bí mật | Ngân sách token theo job và theo tháng (NFR-08) | Nháp: thử lại có giới hạn rồi báo Studio; OCR: báo người dùng "chưa đọc được ảnh, dán câu trích giúp" | REQ-003, REQ-010 |
| IF-04 | Embedding provider | Ra | Vector cho post, story, truy vấn ô dán | HTTPS API, khóa bí mật | Chi phí theo token | Ô dán rơi về tìm trigram; gom cụm hoãn đến chu kỳ sau | REQ-003, REQ-009 |
| IF-05 | Link người dùng gửi | Vào | Lấy metadata công khai của URL (tiêu đề, Open Graph) | HTTPS GET, không đăng nhập, tôn trọng robots và điều khoản | Timeout 5 s, kích thước tối đa | Trả "Tôi không đọc được link này", mời dán câu trích; không tóm tắt nội dung không đọc được | REQ-003 |
| IF-06 | Zalo, Messenger | Ra (chia sẻ) | Nút chia sẻ, xem trước link | URL chia sẻ / SDK của nền tảng; Web Share API; thẻ Open Graph | Việc Zalo hiển thị ảnh `og:image` **chưa xác minh**, phải test thủ công | Luôn có "Sao chép link" | REQ-007 |
| IF-08 | Threads profile discovery, mentions, replies | Ra | Bài của hồ sơ công khai (≥ 100 follower) theo dõi trong pilot; bài nhắc @toibingu; câu hỏi "vụ gì vậy?" dưới thread của mình | `threads_profile_discovery`, `threads_manage_mentions`, `threads_read_replies` (Advanced Access) | 1.000 req/24h (profile, replies) | Bỏ qua chu kỳ, ghi cảnh báo | REQ-009, REQ-017 |
| IF-09 | Instagram hashtag search | Ra | Bài theo hashtag từ lóng | `instagram_basic` + Instagram Public Content Access, tài khoản IG Business | **30 hashtag khác nhau / 7 ngày**; `recent_media` chỉ 24 giờ | Chọn hashtag theo `trendState` cao nhất | REQ-017 |
| IF-10 | TikTok API for Business: Organic Discovery | Ra | Hashtag, bài hát, từ khóa trending theo `country_code` | Tài khoản Ads + Business, app được duyệt; `discovery.search.words` | Hỗ trợ `VN` **chưa xác minh**; hạn mức chưa xác minh | Nguồn `degraded`; biên tập viên xem Creative Center bằng tay | REQ-017 |
| IF-11 | YouTube Data API v3 | Ra | **Chỉ** để biên tập viên tìm và dẫn nguồn video; không vào điểm nóng | API key | `mostPopular` chỉ còn Music/Movies/Gaming (từ 2025-07-21); `search.list` 100 lần/ngày; lưu ≤ 30 ngày; cấm chỉ số dẫn xuất | Không ảnh hưởng pipeline | REQ-010, REQ-017 |
| IF-12 | Facebook Page Public Content Access | Ra | Bài và bình luận của Page công khai (page meme đối tác) | Feature PPCA + Business Verification | Khả năng được duyệt chưa xác minh; nộp khi có UI | Đường người dùng / biên tập viên gửi link | REQ-009 (sau) |
| IF-07 | Google Search | Vào (crawl) | SEO trang hồ sơ | HTML render sẵn, sitemap, JSON-LD `ClaimReview` | Theo chính sách crawler | Không áp dụng | REQ-012 |

## 4. Design decisions

| Mã | Quyết định | Lý do |
|---|---|---|
| I-01 | Nộp app review Threads ngay đầu pilot; thiết kế P1 chạy được khi chưa có quyền | A1 trong RD là rủi ro lớn nhất về nguồn |
| I-02 | Ngân sách truy vấn Threads chia theo cộng đồng pilot (meme, game, tech) và danh sách cụm câu xin bối cảnh; chu kỳ 15 phút | Không để một cộng đồng ăn hết quota; khớp cửa sổ tín hiệu |
| I-03 | Không dùng `pytrends` (đã archived 04/2025); RSS là đường duy nhất cho Google Trends | Giảm rủi ro bị chặn và bảo trì |
| I-04 | Mọi nội dung lấy từ ngoài và mọi đầu ra LLM là dữ liệu, không là lệnh; prompt LLM tách rõ phần nguồn | Chống chèn lệnh qua nội dung mạng xã hội |
| I-05 | Mỗi adapter trả về `Source` có `accessMethod` thuộc danh sách cho phép (`official_api`, `user_submitted`, `editor_added`) | Khóa NFR-05 bằng kiểu dữ liệu |
| I-06 | Số liệu YouTube không bao giờ vào `heat()` hay `trendState()` (chính sách YouTube III.E.4.h, III.E.2) trừ khi được duyệt III.L | Tránh vi phạm điều khoản nền tảng |
| I-07 | Không dùng TikTok Research API, Meta Content Library (chỉ cho nghiên cứu phi lợi nhuận), không dùng wrapper/actor bên thứ ba, không cào JSON của Creative Center | Điều khoản TikTok §5, Meta; bất biến "không cào" |
| I-08 | Quota Threads tính theo từng người dùng: mỗi biên tập viên thật đăng nhập bằng tài khoản của mình; cấm tài khoản phụ để nhân quota | Điều khoản Meta |
| I-09 | Danh sách quyền cần xin và thứ tự nộp: `docs/00-intake/research/platform-access.md` | Owner nộp; adapter chỉ bật khi có credential |
| I-10 | Adapter đã có trong `packages/ingest`: IF-01 (Threads), IF-02 (Google Trends RSS), IF-09 (Instagram hashtag); IF-10 (TikTok Discovery) chờ app được duyệt và tài liệu API, không đoán endpoint. Adapter không bao giờ throw; giữ quota phía mình (2.200 truy vấn/24 giờ/token Threads; 30 hashtag/7 ngày) | Pipeline không dừng khi một nguồn hỏng; không chạm giới hạn nền tảng |

## 5. Data and NFR notes

Dữ liệu từ các tích hợp đi vào các thực thể `Post`, `Signal`, `ContextRequest` (SD-TBY001). Giới hạn chi phí và cảnh báo: SD-TBN001.
