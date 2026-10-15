# Research — kịch bản thu hút người dùng (2026-10-15)

> HISTORICAL input cho requirement. Nguồn lấy qua web search, chưa mở trực tiếp DataReportal/Statcounter/văn bản luật gốc. Mọi mục **UNVERIFIED** phải kiểm lại trước khi trích dẫn ra ngoài. Mọi mục tiêu số là **giả thuyết pilot**.

## 1. Bằng chứng từ sản phẩm tương tự
| Sản phẩm | Cơ chế | Áp dụng cho Toibingu | Nguồn |
|---|---|---|---|
| r/OutOfTheLoop (~3,6–3,7M thành viên, từ 2013) | Câu hỏi phải kèm link ngữ cảnh; câu trả lời đầu phải trung lập, ý kiến gắn nhãn "Biased:"; không nhận trả lời chỉ có link; cấm trả lời do AI viết (2023) | Hồ sơ tách "chuyện gì xảy ra" (trung lập) khỏi "người ta nghĩ gì"; không nhận đóng góp chỉ có link | gummysearch.com/r/OutOfTheLoop · wiki rules (mirror) |
| Ground News Blindspot | Đánh dấu tin một phía đưa nhiều, phía kia gần như không | Khung "ngoài bong bóng": "Dân game biết hết, dân văn phòng chưa ai biết" | about.ground.news/blindspot |
| Particle | Đơn vị = câu chuyện tổng hợp nhiều nguồn, nguồn hiện rõ | Gom theo "vụ", nguồn ở đầu | techcrunch.com 2024-11-12 |
| Artifact (đóng 01/2024) | Đội 8 người không kham nổi kiểm duyệt khi mở đăng bài/bình luận | **Không mở bình luận tự do ở MVP**; đóng góp qua hàng chờ biên tập | engadget.com |
| Semafor Signals | Tin ngắn + khối góc nhìn do phóng viên viết, AI chỉ hỗ trợ tìm nguồn | Khung: Tóm tắt / Bối cảnh / Các phe nói gì | startupwired.com 2024-02 |
| Axios Smart Brevity | Nhãn in đậm cố định, mỗi nhãn 1 câu | Nhãn cố định trong hồ sơ | journalism.co.uk |
| Know Your Meme | About/Origin/Spread; trạng thái Confirmed / đang xét; ghi người sửa + ngày | Hiện "Đã kiểm chứng / Đang xác minh" + biên tập viên + ngày cập nhật | knowyourmeme.com style guide |
| Wikipedia ITN | Chỉ lên trang chủ khi đủ chất lượng + đủ quan trọng; 4–6 mục | Ngưỡng lên trang chủ; trang chủ ít thẻ | thewikipedian.net |
| Wordle | Lưới emoji khoe kết quả không lộ đáp án; mỗi ngày 1 lượt (~90 → ~300k người trong 2 tháng, số thứ cấp) | Thẻ quiz chia sẻ không lộ đáp án; 1 bộ/tuần | knowyourmeme.com/memes/subcultures/wordle |
| Morning Brew / theSkimm | Referral theo mốc; ~20–30% / ~10% đăng ký từ giới thiệu (số bên thứ ba) | Mốc ghi nhận theo số người mình giúp hiểu, không dùng tiền | referralcandy.com · viral-loops.com |
| Duolingo streak | 600+ thử nghiệm; bị chỉ trích gây lo âu/tội lỗi | Thói quen nhẹ, **không** streak mất trắng | businessofapps.com · screenwiseapp.com |
| BuzzFeed quiz | Chia sẻ vì kết quả "đúng là mình", fandom chạy nhất (nhận định) | Biệt danh tự giễu theo cộng đồng | slate.com 2014 |
| X Community Notes | Hữu ích chỉ khi người có quan điểm khác nhau cùng đánh giá tốt; ~10% note được hiện | "Thánh thông não" xếp theo đóng góp được duyệt + được đánh giá hữu ích, không theo số lượng | arxiv.org/html/2510.09585v3 |
| TikTok như search | 64–74% Gen Z Mỹ dùng TikTok tìm kiếm (khảo sát lệch mẫu) | Phiên bản video dọc của hồ sơ (sau) | ypulse.com 2023-09 |

## 2. Việt Nam
- Internet 79,8M; Facebook 76,2M; YouTube 62,3M; TikTok 40,9M (quy mô quảng cáo, không phải MAU) — datareportal.com/reports/digital-2025-vietnam.
- Zalo 79,2M MAU (Q3/2025), ~2,1 tỷ tin nhắn/ngày — tuoitre.vn; 81,3M (Q2/2026) chỉ 1 nguồn (technode.global). Thâm nhập 83% (Decision Lab Q3/2025).
- Threads VN: thâm nhập 10% (Q2/2024) → 15% (Q4/2024), chủ yếu Gen Z/Y — decisionlab.co.
- Cốc Cốc ~3,5–4,2% thị phần trình duyệt (06–08/2026), Chrome ~71% — gs.statcounter.com.
- Kiến Không Ngủ: từ 10/2021, 1M follower TikTok sau 5 tháng — brandsvietnam.com; số hiện tại **UNVERIFIED**.
- Zalo có render og:image khi chia sẻ link: **UNVERIFIED — phải tự test**.
- **Rủi ro pháp lý:** Nghị định 147/2024/NĐ-CP (hiệu lực 25/12/2024) — mạng xã hội phải xác thực tài khoản bằng số điện thoại trước khi cho đăng/bình luận (luatvietnam.vn). Mở đóng góp công khai có thể khiến Toibingu bị coi là MXH → **cần luật sư xác nhận (UNVERIFIED)**.

## 3. Kịch bản (Hook: trigger → action → reward → investment → re-entry)
| # | Persona · kênh | Trigger | Action | Reward | Investment | Re-entry | Metric (giả thuyết) |
|---|---|---|---|---|---|---|---|
| K1 | Dân văn phòng · nhóm Zalo công ty | Cả nhóm cười một câu, mình không hiểu | Dán câu vào "Dán link, ảnh hoặc câu bạn không hiểu" | Hiểu trong 60s | Bấm "Hiểu rồi", gửi thẻ "Bạn không ngu. Bạn thiếu tập 1. Đây là tập 1." | Trigger nội tại lần sau | Dán → đúng hồ sơ ≥70%; time-to-understand <90s |
| K2 | Gamer · Threads/FB | Thẻ "Top vụ cả làng chưa hiểu" có drama game | Bấm "Tôi biết rồi" | "Bạn thuộc 12% đã biết vụ này" | Gửi nguồn bổ sung | Báo khi đóng góp được duyệt | Duyệt ≥40%; thời gian duyệt <24h |
| K3 | Phụ huynh · Google/FB | Con nói một từ lạ | Search "X là gì" → trang SEO | Khối "Có gì đáng lo không?" trung lập, có nguồn | Lưu "Vụ tôi theo dõi" (cục bộ, không đăng nhập) | Cập nhật khi có diễn biến | D7 từ search ≥10% |
| K4 | Dân tech · Messenger | Bạn gửi thẻ chia sẻ | Mở link, không đăng nhập | "Vụ liên quan bạn cũng đang thiếu" | "Không quan tâm" dạy feed | Trang chủ hôm sau hợp gu hơn | Khách mới / lần chia sẻ ≥0,3 |
| K5 | Sinh viên · quiz tuần | "5 vụ tuần này, bạn nắm mấy vụ?" | Làm quiz | Biệt danh tự giễu + lưới không lộ đáp án | Nickname opt-in | Quiz tuần sau | Hoàn thành → chia sẻ ≥15% |
| K6 | Desktop · extension (sau MVP) | Bôi đen chữ lạ | "Tôi bị ngu vụ này" | Hồ sơ hiện tại chỗ | Ghim extension | Mỗi lần bôi đen | WAU / lượt cài |
| K7 | Admin page meme đối tác | Bình luận toàn "ủa là sao?" | Ghim link hồ sơ | Bớt bị hỏi lại, được ghi nguồn | Gửi vụ tiếp theo | Mỗi đợt trend | Phiên từ đối tác ≥20% |

## 4. Vòng thu hút (xếp theo tác động/công sức cho MVP)
1. Thẻ chia sẻ Zalo/Messenger — cao / thấp–TB (phải test preview Zalo).
2. SEO "X là gì / vụ X là gì" — TB–cao, chậm / TB (mỗi vụ 1 URL công khai có ngày cập nhật).
3. Hợp tác creator/page meme — TB–cao / TB, có chi phí (ghi nguồn hai chiều; rủi ro thương hiệu).
4. Gieo nội dung Threads — TB / thấp.
5. Extension — thấp ở MVP / cao (Cốc Cốc ~4%, phần lớn người dùng trên di động).

## 5. Cần tránh
- Gọi người cụ thể là "ngu"/"tối cổ" — bảng chỉ xếp **vụ**, không xếp người theo độ không biết.
- Streak mất trắng, thông báo gây tội lỗi.
- Đưa tin đồn lên trang chủ trước kiểm chứng; vụ "Đang xác minh" không được chia sẻ.
- Tiêu đề câu tò mò không có lời giải — thẻ chia sẻ phải tự trả lời trong 1 câu.
- Bắt đăng nhập, xin danh bạ, tự gửi lời mời.
- Kết quả quiz lộ ai không biết vụ gì.
- Bình luận tự do (bài học Artifact + Nghị định 147).
- Thưởng theo số lượng đóng góp.

## 6. Bộ engagement MVP đề xuất
1. Trang chủ 4–6 thẻ + 3 nút. 2. Ô dán link/ảnh/câu. 3. Thẻ chia sẻ "Bạn thiếu tập 1" tối ưu Zalo/Messenger. 4. Bảng "Top vụ cả làng chưa hiểu" + URL "vụ X là gì". 5. Quiz "Hội tối cổ" tuần, opt-in, lưới không lộ đáp án.
- "Thánh thông não" → v2 (sau luồng biên tập + ý kiến pháp lý).
- **North Star:** số lượt "thông não" thành công/tuần (đọc hết hồ sơ + bấm "Hiểu rồi").
- Phụ (giả thuyết): dán→đúng hồ sơ ≥70% · chia sẻ/lượt đọc xong ≥8% · khách mới/lần chia sẻ ≥0,3 · D7 ≥15% · "Không quan tâm"/thẻ ≤25% · báo lỗi → sửa <24h · vụ gỡ vì sai sự thật = 0.
