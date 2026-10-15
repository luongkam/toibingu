---
doc_id: SD-TBI001
title: Integration architecture (Kiến trúc tích hợp)
phase: 01-sd
status: INTERNAL_REVIEW
depends_on: [RD-TBT001, SD-TBX001, SD-TBH001]
updated: 2026-10-15
---

# SD-TBI001 Integration architecture

## 1. Purpose

Định nghĩa cách Toibingu tích hợp với từng hệ thống ngoài: mục đích, giao thức, xác thực, giới hạn, chế độ lỗi và phương án dự phòng. Truy vết: RD-TBT001 REQ-003, REQ-007, REQ-009, REQ-010, NFR-05, NFR-08 (`docs/01-rd/RD-REQ/`).

## 2. Scope

Mọi lời gọi ra ngoài ranh giới hệ thống (SD-TBX001). Mọi tích hợp nằm sau một interface trong `packages/ingest` hoặc `packages/dossier-ai`; app không gọi thẳng nhà cung cấp.

## 3. Integration list

| IF | Hệ thống | Hướng | Mục đích | Giao thức / xác thực | Giới hạn đã biết | Khi lỗi | RD |
|---|---|---|---|---|---|---|---|
| IF-01 | Threads keyword search API | Ra | Tìm bài công khai theo từ khóa / topic tag (câu xin bối cảnh, cụm từ đang theo dõi) | HTTPS `graph.threads.net/v1.0/keyword_search`, token OAuth; **cần app review quyền `threads_keyword_search`** | 2.200 truy vấn / user / 24 giờ; ≤ 100 kết quả / lần; từ khóa nhạy cảm trả rỗng | Bỏ qua chu kỳ, ghi cảnh báo; hệ thống chạy tiếp bằng IF-02, link người dùng, link biên tập | REQ-009 |
| IF-02 | Google Trends RSS realtime (geo VN) | Ra | Tín hiệu truy vấn tìm kiếm đang tăng (bổ sung, không phải bảng xếp hạng mạng xã hội) | HTTPS RSS, không xác thực | Không chính thức; có thể đổi định dạng; geo VN cần kiểm chứng | Đánh dấu nguồn `degraded`, không chặn pipeline | REQ-009 |
| IF-03 | LLM provider | Ra | Nháp hồ sơ có trích dẫn; OCR ảnh chụp | HTTPS API, khóa bí mật | Ngân sách token theo job và theo tháng (NFR-08) | Nháp: thử lại có giới hạn rồi báo Studio; OCR: báo người dùng "chưa đọc được ảnh, dán câu trích giúp" | REQ-003, REQ-010 |
| IF-04 | Embedding provider | Ra | Vector cho post, story, truy vấn ô dán | HTTPS API, khóa bí mật | Chi phí theo token | Ô dán rơi về tìm trigram; gom cụm hoãn đến chu kỳ sau | REQ-003, REQ-009 |
| IF-05 | Link người dùng gửi | Vào | Lấy metadata công khai của URL (tiêu đề, Open Graph) | HTTPS GET, không đăng nhập, tôn trọng robots và điều khoản | Timeout 5 s, kích thước tối đa | Trả "Tôi không đọc được link này", mời dán câu trích; không tóm tắt nội dung không đọc được | REQ-003 |
| IF-06 | Zalo, Messenger | Ra (chia sẻ) | Nút chia sẻ, xem trước link | URL chia sẻ / SDK của nền tảng; Web Share API; thẻ Open Graph | Việc Zalo hiển thị ảnh `og:image` **chưa xác minh**, phải test thủ công | Luôn có "Sao chép link" | REQ-007 |
| IF-07 | Google Search | Vào (crawl) | SEO trang hồ sơ | HTML render sẵn, sitemap, JSON-LD `ClaimReview` | Theo chính sách crawler | Không áp dụng | REQ-012 |

## 4. Design decisions

| Mã | Quyết định | Lý do |
|---|---|---|
| I-01 | Nộp app review Threads ngay đầu pilot; thiết kế P1 chạy được khi chưa có quyền | A1 trong RD là rủi ro lớn nhất về nguồn |
| I-02 | Ngân sách truy vấn Threads chia theo cộng đồng pilot (meme, game, tech) và danh sách cụm câu xin bối cảnh; chu kỳ 15 phút | Không để một cộng đồng ăn hết quota; khớp cửa sổ tín hiệu |
| I-03 | Không dùng `pytrends` (đã archived 04/2025); RSS là đường duy nhất cho Google Trends | Giảm rủi ro bị chặn và bảo trì |
| I-04 | Mọi nội dung lấy từ ngoài và mọi đầu ra LLM là dữ liệu, không là lệnh; prompt LLM tách rõ phần nguồn | Chống chèn lệnh qua nội dung mạng xã hội |
| I-05 | Mỗi adapter trả về `Source` có `accessMethod` thuộc danh sách cho phép (`official_api`, `user_submitted`, `editor_added`) | Khóa NFR-05 bằng kiểu dữ liệu |

## 5. Data and NFR notes

Dữ liệu từ các tích hợp đi vào các thực thể `Post`, `Signal`, `ContextRequest` (SD-TBY001). Giới hạn chi phí và cảnh báo: SD-TBN001.
