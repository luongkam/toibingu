# Toibingu

**Bắt kịp chuyện đang hot ngoài feed của bạn.**
*"Không phải tôi ngu. Tôi chưa xem tập trước."*

Web tối ưu điện thoại. Đơn vị nội dung là **một câu chuyện**, mỗi câu chuyện có một **hồ sơ bắt kịp** do biên tập viên duyệt, có nguồn và nhãn xác minh.

## Đọc gì trước
| Cần biết | Ở đâu |
|---|---|
| Luật làm việc (người và agent) | [AGENTS.md](AGENTS.md) |
| Yêu cầu sản phẩm (WHAT) | [RD-TBT001](docs/01-rd/RD-REQ/RD-TBT001-customer-requirements.md) |
| Thiết kế hệ thống (HOW) | [SD-INDEX](docs/01-sd/SD-INDEX.md) |
| Ý tưởng gốc và research | [docs/00-intake](docs/00-intake/) |

## Cấu trúc repo
```
docs/00-intake/      brief + research (đầu vào, historical)
docs/01-rd/          requirement design (NEXA G1)
docs/01-sd/          system design: context, architecture, nfr, integration, data, policy (NEXA G1_5)
packages/domain/     kiểu lõi, xếp hạng, cổng xuất bản (có test)
packages/signals/    nhận diện câu xin bối cảnh, cụm "X là gì" (có test)
packages/lexicon/    engine từ lóng / trend: trạng thái nóng, duyệt, khớp, đề xuất (có test)
data/lexicon/        lexicon đã review + đề xuất của skill trend-scout
apps/web/            trang tĩnh: trang chủ + hồ sơ + /api/version.json (SD-TBH001 H-18)
apps/worker/         chu kỳ gom trend (run-once trên máy owner)
data/dossiers/       hồ sơ bắt kịp (JSON, duyệt qua PR)
scripts/harness/     NEXA harness: verify + hooks
scripts/ci/          check-docs (NEXA G1/G1_5, id, trace)
tests/harness/       self-test của harness
```

## Chạy
```bash
pnpm install
pnpm verify            # chỉ các check diff cần
pnpm verify -- --full  # mọi check, bắt buộc trước PR/merge
pnpm build:web /tmp/site --preview   # xem cả bản nháp
pnpm build:web /tmp/site             # bản công khai (chỉ hồ sơ đã duyệt)
```
