# Research — zca-js vs fca: rủi ro bảo mật (2026-10-16)

> HISTORICAL. Câu hỏi của owner: "fca bị gắn cờ mã độc, chắc giống zca đúng không, tôi vẫn đang dùng zca". **UNVERIFIED** = chưa xác minh bằng nguồn gốc.

## Kết luận
- **zca-js gốc (npm `zca-js`, publisher `rfs-adreno`, repo RFS-ADRENO/zca-js): không thấy mã độc.** Audit tĩnh bản 2.2.0 (bên dưới) + không có advisory (GHSA, OSV).
- **Mã độc của "fca" nằm ở các bản fork người khác đăng lại lên npm** dưới tên khác (fca-horizon-remaster, fca-horizon-remastered, fca-raihan…). Quanh zca-js **đã có ≥ 15 bản đăng lại tương tự** (zca-official, new-zca-js, zca-js-kaka, @…/zca-js…): chưa bị gắn cờ, chưa ai review code. Cùng loại rủi ro.
- **Rủi ro lớn hơn là tài khoản:** Điều khoản Zalo §4.7 cấm đăng nhập bằng phần mềm bên thứ ba chưa được cấp phép; §14.2(iv) cho phép khóa. README zca-js tự cảnh báo có thể bị khóa.

## Audit tĩnh zca-js@2.2.0 (2026-10-16, tarball tải bằng `npm pack --ignore-scripts`, không cài, không chạy)
| Kiểm tra | Kết quả |
|---|---|
| Integrity tarball | `sha512-pBU0T0/uadH3Neq7yMssUmE769VVuqKhL8YD1HqQQG8e6lkwueAopNu0vhJdqiJRHZdPIEomT2FxRzauOx4pgA==` khớp registry |
| Install scripts | Không có `preinstall`/`install`/`postinstall` (`prepare: husky` không chạy khi cài từ npm) |
| Dependencies | ws, pako, semver, crypto-js, form-data, spark-md5, json-bigint, tough-cookie (range `^`) |
| Host trong mã | Chỉ `*.zalo.me` (id, chat, wpa.chat, jr.chat) + endpoint Zalo trả về lúc login (`zpwServiceMap`) + `registry.npmjs.org/zca-js` |
| `registry.npmjs.org` | Chỉ GET kiểm tra bản mới, không gửi dữ liệu; tắt bằng `checkUpdate: false` |
| `child_process`, `eval`, `new Function`, `process.env`, webhook Discord/Telegram, chuỗi hex làm rối | Không có |
| `fs` / `writeFile` | Ghi ảnh QR đăng nhập; đọc file đính kèm để upload |
| Cookie | Quản lý bằng `tough-cookie`, chỉ gắn vào đúng domain Zalo |
| Base64 | Giải mã gói AES của Zalo |
| Credentials | `loginQR()` trả `{cookie, imei, userAgent}`; thư viện không tự lưu; ai có 3 giá trị này là điều khiển được tài khoản |

## Các vụ fca bị gắn cờ mã độc
| Gói | Nguồn | Ngày |
|---|---|---|
| fca-horizon-remaster | GHSA-vq4c-q64f-3p83 / OSV MAL-2023-398 (mọi phiên bản) | 2023-07-18 |
| fca-horizon-remastered | GHSA-g85m-q732-fr68 / MAL-2023-399 | 2023-07-03 |
| fca-hrz-remake | GHSA-qmjq-3g8r-29mc / MAL-2023-400 | 2023-02-03 |
| fca-raihan 37.2.5–37.2.6 | GHSA-gmjq-r5g4-xc73: tự phụ thuộc vào repo GitHub, mỗi lần cài kéo code mới nhất và chạy install script | 2026-09-30 |
| fca-horizon, fca-kemdev, fca-priyansh1/3, fca-imran-api, fca-shaon-project, cyber-fca, shadowx-fca… | Danh sách malware GHSA | 2023–2026 |

Advisory không mô tả payload; việc đánh cắp appState/cookie là **UNVERIFIED**. Liên quan: Cisco Talos "PXA Stealer" (người Việt đánh cắp cookie trình duyệt, bán tài khoản Facebook/Zalo).

## Checklist cho người đang dùng zca-js
1. Đúng gói `zca-js` của `rfs-adreno`; ghim phiên bản chính xác; commit lockfile; cài bằng `npm ci` / `pnpm install --frozen-lockfile`.
2. Trước mỗi lần nâng cấp: `npm view zca-js maintainers`, diff gói giữa hai phiên bản, chờ vài ngày sau bản mới.
3. `ignore-scripts=true` (hoặc pnpm `onlyBuiltDependencies`); cảnh giác dependency trỏ thẳng git/GitHub (kiểu fca-raihan).
4. Tài khoản Zalo và số điện thoại riêng cho bot, không dùng tài khoản chính.
5. cookie + imei + userAgent = mật khẩu: để trong secret store / env, không vào repo, log, thư mục chia sẻ; xóa ảnh QR sau khi đăng nhập.
6. Nghi ngờ: đăng xuất phiên từ điện thoại (quản lý thiết bị), đăng nhập lại.
7. Chạy trong container riêng; chỉ cho ra `*.zalo.me` (và npm registry, hoặc `checkUpdate: false`).
8. `npm audit` + Socket mỗi lần đổi dependency.
9. Nhịp như người: không tra số hàng loạt, không nhắn hàng loạt (issue #173, #351, #291 cho thấy bị giới hạn).

## Kênh chính thức thay thế (cho việc kinh doanh)
Zalo Official Account API (nhắn người đã tương tác), ZNS (template giao dịch trả phí), Zalo Bot Platform (bot.zapps.me, token + webhook), Zalo Mini App.

## Nguồn
- github.com/advisories/GHSA-vq4c-q64f-3p83 · osv.dev/vulnerability/MAL-2023-398 · osv.dev/vulnerability/MAL-2023-399 · osv.dev/vulnerability/MAL-2023-400 · github.com/advisories/GHSA-gmjq-r5g4-xc73
- socket.dev/blog/npm-malware-targets-telegram-bot-developers · blog.talosintelligence.com/new-pxa-stealer/
- zalo.vn/dieukhoan (§4.4, §4.5, §4.7, §14.2) · github.com/RFS-ADRENO/zca-js · zca-js.tdung.com
