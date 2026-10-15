## Yêu cầu (nguyên văn)


## Phạm vi
- REQ / SD liên quan (RD-TBT001, SD-TB…):
- App / package chạm tới:
- Tier: S | L (Tier L: link `plans/<yymmdd-hhmm>-<slug>/plan.md` đã được duyệt)

## Nghiệm thu (3–7 dòng, mỗi dòng gắn với 1 test hoặc 1 lệnh)
- [ ]

## Verify
Dán nguyên phần tóm tắt `pnpm verify -- --full`, chạy trên cây sạch (`diff=e3b0c4`, dòng `THANG:` không có "(+ thay đổi chưa commit)"). `sha=` phải khớp head của PR, `exit=0`.
```
```

## PASS / FAIL / NOT_TESTED
Mỗi NOT_TESTED kèm 1 lý do.

## Deploy
- Dán 2 dòng `THANG:` / `DEPLOY:` từ verify. Nấc cuối "đã deploy" chỉ chủ sản phẩm xác nhận.

## Rollback
Revert PR này trên `main` rồi deploy lại. Hồ sơ đã xuất bản: xuất bản phiên bản mới, không sửa tại chỗ.

Quy tắc merge (áp dụng cho mọi người và mọi agent): chỉ merge khi có khối `--full` với sha khớp head, 0 FAIL, 0 INVALID.
