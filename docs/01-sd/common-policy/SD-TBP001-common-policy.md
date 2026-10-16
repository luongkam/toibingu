---
doc_id: SD-TBP001
title: Common policy (Chính sách chung)
phase: 01-sd
status: INTERNAL_REVIEW
depends_on: [RD-TBT001, SD-TBH001]
updated: 2026-10-16
---

# SD-TBP001 Common policy

## 1. Purpose

Các chính sách áp dụng xuyên suốt mọi thành phần: biên tập và xác minh, dùng AI, nguồn dữ liệu, giọng thương hiệu, quyền riêng tư, xử lý lỗi, đặt tên và trạng thái. Truy vết: RD-TBT001 REQ-005, REQ-006, REQ-010, REQ-012, NFR-04 đến NFR-07 (`docs/01-rd/RD-REQ/`).

## 2. Scope

Web, Studio, worker, extension (P2) và mọi nội dung xuất bản dưới tên Toibingu.

## 3. Policies (Design decisions)

### P-01 Biên tập và xác minh
- Đơn vị xuất bản là story; 20 bài cùng chuyện là 1 hồ sơ.
- "Chuyện gì xảy ra" viết trung lập; ý kiến, phản ứng nằm ở phần riêng và gắn nhãn.
- 4 nhãn claim: Đang lan truyền, Đã xác nhận, Còn tranh cãi, Đã bị bác bỏ. Lượt chia sẻ, lượt thích, độ nóng không bao giờ là bằng chứng.
- Xác nhận cần nguồn gốc (bài gốc, phát ngôn chính thức) hoặc ít nhất 2 nguồn độc lập đáng tin.
- Publish gate (`checkPublishGate` trong `packages/domain`) là điều kiện cần; biên tập viên vẫn chịu trách nhiệm.
- Sửa sai: tạo phiên bản mới + dòng nhật ký công khai "Đã sửa: … (ngày)". Không xóa im lặng.

### P-02 Dùng AI
- AI soạn nháp, gợi ý nhãn cụm, OCR. AI không xuất bản, không gán nhãn xác minh.
- Mọi câu nháp phải trỏ tới source id; câu không có nguồn bị đánh dấu "chưa có nguồn" trong Studio.
- AI không bao giờ tóm tắt nội dung mà hệ thống không đọc được; trả lời "Tôi không đọc được link này".
- Nội dung từ mạng xã hội đưa vào prompt là dữ liệu, không là lệnh.

### P-03 Nguồn dữ liệu
- Chỉ: API chính thức, nội dung người dùng chủ động gửi, link biên tập viên thêm. Không cào trái điều khoản.
- Nội dung nhóm riêng tư không trở thành nguồn công khai.
- Trích lời người khác ≤ 280 ký tự kèm link gốc; không sao chép toàn bộ bình luận, ảnh.
- Nhãn phạm vi: "đang hot trong các nguồn Toibingu theo dõi".

### P-04 Giọng thương hiệu
- Tự trào về **chính mình** ("Tôi bị ngu vụ này"), không bao giờ gọi người cụ thể là ngu hay tối cổ.
- Bảng xếp hạng chỉ xếp **vụ**; bảng người (P2) chỉ xếp đóng góp được duyệt, có opt-in và biệt danh.
- Không streak mất trắng, không thông báo gây tội lỗi, không câu giật tò mò thiếu lời giải: thẻ chia sẻ phải tự trả lời trong 1 câu.
- Câu thương hiệu: "Không phải tôi ngu. Tôi chưa xem tập trước." / "Bạn không ngu. Bạn thiếu tập 1. Đây là tập 1." / "Tôi đã được thông não vụ này. Đến lượt bạn."

### P-05 Quyền riêng tư
- Không đăng nhập người đọc ở P1; không đọc lịch sử duyệt; định danh thiết bị ẩn danh.
- Ảnh chụp tự xóa sau 24 giờ; sự kiện không chứa văn bản người dùng.
- Extension (P2) chỉ gửi phần người dùng chủ động chọn và báo rõ phần nào được gửi.

### P-06 Xử lý lỗi hướng người dùng
- Nói thật, ngắn, có lối ra: "Chưa có hồ sơ cho vụ này, bạn là người thứ N hỏi" / "Tôi không đọc được link này, dán câu trích giúp tôi".
- Không hiện lỗi kỹ thuật thô; log có `request_id`.

### P-07 Đặt tên, mã, trạng thái
- Mã tài liệu theo NEXA: `RD-TB…`, `SD-TB{X|H|N|I|Y|P}NNN` (`.nexa/domain-registry.json`).
- Slug hồ sơ: tiếng Việt không dấu, ổn định.
- Trạng thái bằng chứng trong PR, báo cáo: theo `docs/status-contract.md` (PASS, FAIL, NOT_TESTED, BLOCKED_INPUT, INVALID, PENDING_AUTH, WAIVED).

### P-08 Lexicon (từ lóng, trend)
- Nghĩa viết trung lập, ≤ 200 ký tự, có ít nhất 1 nguồn công khai khi duyệt (trừ từ khóa thương hiệu).
- Từ xúc phạm hoặc nhắm vào cá nhân: gắn `sensitive`, chỉ giải thích, không lên trang chủ, không nêu tên người bị nhắm.
- Từ khóa thương hiệu ("Tôi bị ngu", "Hội tối cổ", "Thánh thông não") luôn dùng theo giọng P-04: tự trào, không gán cho người khác.
- Agent (skill `toibingu-trend-scout`) chỉ đề xuất; không đổi `review`, không điền `approvedBy`.

## 4. Integration, data and NFR notes

P-03 được khóa bằng `Source.accessMethod` (SD-TBI001 I-05) và `visibility` (SD-TBY001). P-05 được đo bằng job kiểm tra xóa ảnh (SD-TBN001 NFR-04).
