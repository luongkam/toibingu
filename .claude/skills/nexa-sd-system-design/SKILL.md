---
name: nexa-sd-system-design
tier: pro
description: "Viết System Design (SD = Design Definition, phase 01-sd, sau RD và trước BD): 6 loại tài liệu X system-context, H architecture (方式設計), N NFR, I integration architecture, Y data architecture, P common policy, ra `01-sd/<loại>/SD-{D}{T}NNN-<slug>.md`, cập nhật SD-INDEX.md, chạy gate G1_5. Triggers: viết SD, System Design, thiết kế hệ thống, thiết kế kiến trúc, 方式設計, 設計定義, システム設計, NFR design, integration architecture, data architecture, 01-sd, SD-INDEX, G1_5. Không dùng cho: mô tả màn hình / Screen Description (dùng nexa-sd-writer), BD (bd-generation), DD (dd-generation)."
---

# NEXA SD SYSTEM DESIGN

SD (D8) = System Design = Design Definition: quyết định cấp hệ thống, sau `01-rd`, trước `02-bd`.
Không phải Detailed Design (`03-dd`), không phải Screen Description (`nexa-sd-writer`).

`<skill>` dưới đây là thư mục chứa file này (thường là `.claude/skills/nexa-sd-system-design`).

## Sáu loại SD

| Code | Thư mục `01-sd/` | Nội dung | Template |
|---|---|---|---|
| X | `system-context/` | actor, hệ thống ngoài, ranh giới, sơ đồ context | `references/templates/sd-X-system-context.md` |
| H | `architecture/` | 方式設計: kiểu kiến trúc, component, tech stack, deploy | `references/templates/sd-H-architecture.md` |
| N | `nfr/` | 非機能要求グレード: mục tiêu, cách đo, biện pháp | `references/templates/sd-N-nfr.md` |
| I | `integration-architecture/` | danh mục interface, chính sách retry/auth, phục hồi | `references/templates/sd-I-integration-architecture.md` |
| Y | `data-architecture/` | domain dữ liệu, luồng, lưu giữ, migration (không DDL) | `references/templates/sd-Y-data-architecture.md` |
| P | `common-policy/` | log, lỗi, authN/Z, ngày giờ, i18n, audit, code value | `references/templates/sd-P-common-policy.md` |

Id: `SD-{DOMAIN}{T}{NNN}` (DOMAIN 2-4 chữ hoa, T là code ở bảng trên, NNN ≥ 3 ký tự). Tên file:
`SD-{DOMAIN}{T}{NNN}-<slug-kebab>.md`. Doctype registry: `sd-system-context`, `sd-architecture`, `sd-nfr`,
`sd-integration-architecture`, `sd-data-architecture`, `sd-common-policy` (section contract = template tương ứng).

## Đầu vào (thiếu thì dừng, trạng thái `BLOCKED_INPUT`)

1. RD đã duyệt trong `01-rd/` (id `RD-...`), hoặc nguồn RD khách hàng có đường dẫn.
2. Domain code của dự án (`.nexa/control/naming-rule.md`, hoặc id RD hiện có).
3. Ràng buộc đã biết: hạ tầng bắt buộc, hệ thống khách đang chạy, NFR khách yêu cầu (từ RD/KB, không tự bịa).

## Các bước

1. **Đọc** RD, KB (`00-intake/knowledge`), `01-sd/SD-INDEX.md` hiện có. Lập danh sách loại SD cần viết
   (mặc định đủ 6; dự án nhỏ có thể gộp P vào H nhưng vẫn giữ X, H, N).
2. **Đánh số** (`.nexa/control/naming-rule.md`): sequence `000` dành cho tài liệu danh sách của một domain+loại
   (`SD-{D}{T}000`); tài liệu SD thường bắt đầu `001`, lấy số tiếp theo theo SD-INDEX.md, không dùng lại id cũ.
   `depends_on` theo `deriveDependencies` (document-control): `SD-{D}{T}000` nếu dự án có tài liệu danh sách đó,
   `RD-{D}T001`, cộng các id RD cụ thể mà tài liệu trích.
3. **Viết** từng file từ template của loại đó vào `01-sd/<thư mục loại>/`:
   - giữ nguyên frontmatter: `doc_id` = id trong tên file, `phase: SD`, `sd_type`, `status` theo trạng thái NEXA
     (`AI_GENERATED` khi agent vừa viết; `INTERNAL_REVIEW`, `CUSTOMER_REVIEW`, `APPROVED` do người đổi), `depends_on`;
   - thư mục `_review/` là biên bản review của phase, không chứa tài liệu SD;
   - giữ mọi heading của template (đó là section contract); điền nội dung riêng của dự án, xóa hết `{...}`;
   - mỗi quyết định (bảng "Design decisions") trỏ về ít nhất một id RD; mục "RD トレース" liệt kê đủ;
   - chỉ ở mức hệ thống: không SQL/DDL, không logic từng item, không bảng item màn hình (đó là BD/DD);
   - điều chưa chắc ghi vào "未確定事項 / Open questions", không đoán;
   - không dùng ký tự em dash U+2014 (dùng `-`), giống quy tắc của `nexa-rd-writer`;
   - ngôn ngữ: theo ngôn ngữ giao khách của dự án (mặc định heading song ngữ JA/EN như template).
4. **SD-INDEX.md**: thêm một dòng mỗi SD vào bảng `| Id | Title | Status | Depends on |` (giữ phần đầu file).
   Không có file thì tạo từ phần đầu của stub NEXA (`nexa init` đã scaffold `01-sd/SD-INDEX.md`).
5. **Gate G1_5** cho từng file:
   - dự án NEXA: `nexa gate run G1_5 --doc-id SD-ACMX001 --body 01-sd/system-context/SD-ACMX001-<slug>.md`
     (bắt buộc `--doc-id`: thiếu nó G1_5 là no-op PASS, không chứng minh gì);
   - repo có harness NEXA: `node scripts/harness/check-docs.mjs` (G1_5, thư mục đúng loại, frontmatter doc_id, status, domain,
     SD-INDEX, em dash, không còn thư mục cũ `02-bd/system-design/` theo D8).
   FAIL thì sửa tài liệu rồi chạy lại; không sửa gate.
6. **Báo cáo** theo status contract: mỗi file một dòng `PASS|FAIL <id> <path>` kèm lệnh gate và exit code;
   danh sách Open questions cần khách trả lời.

## Gates (G1_5, `packages/validation/src/sd-gate.ts`)

- Có `システム概要 / Purpose`, `システム境界 / Scope`, `設計方針 / Design decisions` (hoặc 方式設計 / Architecture).
- Id SD hợp lệ; nội dung trỏ về `RD-...` hoặc `01-rd/`.
- Có nội dung NFR, integration (連携) hoặc data (データ); > 150 từ; không marker mẫu.
- (optional) Không SQL/DDL, không "logic block".

## Không làm

- Không đặt SD trong `02-bd/system-design/` (layout cũ D10, đã bị D8 thay; check `sd.location` sẽ FAIL).
- Không gọi SD là "DD"; không sinh BD/DD từ skill này (chuyển sang `bd-generation` khi SD đã duyệt).
- Không sửa template trong `references/templates/` cho một dự án: khác biệt của dự án nằm trong tài liệu.

## Done when

- Mỗi SD cần thiết có file đúng thư mục, `doc_id` khớp tên file, có trong SD-INDEX.md; domain có trong
  `.nexa/domain-registry.json`.
- G1_5 PASS cho từng file (lệnh + exit code trong báo cáo); `check-docs.mjs` exit 0 nếu repo có harness.
