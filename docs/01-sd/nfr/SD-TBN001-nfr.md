---
doc_id: SD-TBN001
title: Non-functional design (Thiết kế phi chức năng)
phase: 01-sd
status: INTERNAL_REVIEW
depends_on: [RD-TBT001, SD-TBH001]
updated: 2026-10-15
---

# SD-TBN001 Non-functional design

## 1. Purpose

Chỉ ra cách kiến trúc (SD-TBH001) đáp ứng từng yêu cầu phi chức năng NFR-01 đến NFR-10 trong RD-TBT001 (`docs/01-rd/RD-REQ/`), kèm cách đo và ngưỡng cảnh báo.

## 2. Scope

Áp dụng cho web công khai, Studio, worker trong P1. Extension (P2) bổ sung khi tới 02-bd.

## 3. Design decisions per NFR

| NFR | Phương án | Cách đo | Cảnh báo khi |
|---|---|---|---|
| NFR-01 Truy cập | Không có middleware đăng nhập ở `apps/web`; định danh thiết bị là cookie UUID ngẫu nhiên, first-party | Test e2e: mọi route công khai trả 200 khi không có cookie | Một route công khai trả 401/302 tới login |
| NFR-02 Hiệu năng | SSR + cache CDN theo phiên bản hồ sơ, làm mới khi xuất bản; ảnh tối ưu; JS tối thiểu ở trang hồ sơ; font tiếng Việt tự host, `font-display: swap`; ô dán: tìm kiếm trên chỉ mục trigram + vector, timeout 4 s | Web Vitals thực tế (RUM, ghi vào bảng sự kiện) p75 LCP; p95 thời gian ô dán | LCP p75 > 2,5 s trong 3 ngày; p95 ô dán > 4 s |
| NFR-03 Sẵn sàng | Web và Studio không trạng thái; Postgres managed có sao lưu PITR; worker lỗi không ảnh hưởng trang đã xuất bản (đọc từ cache/DB) | Uptime check 1 phút cho `/` và `/api/version` | < 99,5% trong tháng |
| NFR-04 Quyền riêng tư | Không đọc lịch sử duyệt; sự kiện không chứa văn bản người dùng (chỉ mã băm cụm); IP không lưu trong bảng sự kiện; ảnh chụp lưu object storage với vòng đời tự xóa 24 giờ | Job kiểm tra hằng ngày: không còn ảnh > 24 giờ | Có ảnh > 24 giờ |
| NFR-05 Tuân thủ nguồn | Adapter nguồn chỉ có 3 loại `accessMethod` (`official_api`, `user_submitted`, `editor_added`); không có adapter cào HTML mạng xã hội | Test kiểu dữ liệu `Source.accessMethod`; review khi thêm adapter | Adapter mới không thuộc danh sách |
| NFR-06 Chính xác | Publish gate; hàng chờ báo sai có SLA; nhật ký sửa sai công khai | Thời gian từ báo sai đến xử lý; số hồ sơ gỡ | Báo sai mở > 24 giờ |
| NFR-07 Truy vết | Phiên bản hồ sơ bất biến (người duyệt, thời điểm, nguồn); audit log hành động Studio | Truy vấn audit theo hồ sơ | Phiên bản thiếu người duyệt (không thể, gate chặn) |
| NFR-08 Chi phí | Mỗi job LLM/embedding có ngân sách token; bộ đếm chi phí theo tháng; vượt trần thì ngắt job không thiết yếu (nháp AI), giữ job thiết yếu (ô dán) | Dashboard chi phí / hồ sơ | Đạt 80% trần tháng |
| NFR-09 Khả dụng | Font có đủ glyph tiếng Việt cho web và ảnh chia sẻ; bộ chuỗi kiểm thử dấu chồng; tương phản AA | Test ảnh OG với chuỗi dấu; kiểm tra tương phản | Test dấu thất bại |
| NFR-10 Bảo mật | Studio: đăng nhập + vai trò (editor, senior_editor, admin); bí mật trong biến môi trường của nền tảng, không trong repo; giới hạn tần suất ô dán theo thiết bị + IP; kiểm tra loại và kích thước ảnh | Hook harness chặn commit `.env`; review quyền | Thử đăng nhập thất bại bất thường |

## 4. Capacity assumptions (P1)

- < 50.000 người dùng/tháng; < 10.000 post nguồn/ngày; 3 đến 5 hồ sơ mới/ngày; < 5 triệu sự kiện/tháng.
- Vượt giả định nào thì xem lại quyết định tương ứng ở SD-TBH001 (H-04, H-06, H-11).

## 5. Observability

- `/api/version` ở mọi app: commit sha, thời điểm build (H-13).
- Log có cấu trúc (JSON) với `request_id`, không chứa văn bản người dùng.
- Theo dõi lỗi phía server và client; cảnh báo theo bảng mục 3.

## 6. Integration and data notes

Giới hạn tần suất và chế độ lỗi của hệ thống ngoài: SD-TBI001. Thời hạn lưu dữ liệu: SD-TBY001.
