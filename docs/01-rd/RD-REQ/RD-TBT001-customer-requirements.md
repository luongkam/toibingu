---
doc_id: RD-TBT001
title: Toibingu - Customer Requirements (Yêu cầu sản phẩm)
phase: 01-rd
status: INTERNAL_REVIEW
owner: Product owner (Logan)
source: docs/00-intake/product-brief.md, docs/00-intake/research/engagement-scenarios.md, docs/00-intake/research/github-landscape.md
updated: 2026-10-16
---

# RD-TBT001 Toibingu - Customer Requirements

Ngôn ngữ: must = bắt buộc, should = nên, can = tùy chọn. Phase: **P1** = MVP pilot, **P2** = sau khi P1 đạt ngưỡng ở mục 9, **NOW-NOT** = không đầu tư ở giai đoạn này.

## 1. Business Overview (Tổng quan nghiệp vụ)

**Vấn đề.** Người dùng cập nhật nhanh trong cộng đồng của mình vẫn không hiểu câu đùa, biệt danh hay drama của cộng đồng khác, vì chuyện đó chưa đi qua feed của họ. Họ không thiếu năng lực, họ thiếu "tập trước". Hành vi hiện tại là hỏi trong comment ("vụ gì vậy?", "tôi bị ngu, ai thông não với") và chờ người khác trả lời, kết quả rời rạc, thiếu nguồn, dễ lẫn tin đồn.

**Sản phẩm.** Toibingu là web tối ưu điện thoại (P1) giúp người dùng **bắt kịp chuyện đang hot ngoài feed của họ**. Đơn vị nội dung là **một câu chuyện** (story) có **hồ sơ bắt kịp** (catch-up dossier) được biên tập viên duyệt, có nguồn và nhãn xác minh.

**Định vị.** "Toibingu: Bắt kịp chuyện đang hot ngoài feed của bạn." Tagline: "Không phải tôi ngu. Tôi chưa xem tập trước."

**Mục tiêu kinh doanh (P1 pilot, 8 tuần).** Chứng minh 4 giả thuyết trước khi đầu tư mở rộng:
1. Người đọc hiểu hơn thật (North Star: số lượt "thông não" thành công mỗi tuần = đọc hết phần mặc định của hồ sơ + bấm "Hiểu rồi").
2. Chia sẻ kéo được người mới (khách mới / lần chia sẻ).
3. Người dùng quay lại khi chưa có câu hỏi cụ thể (D7 return).
4. Chi phí vận hành để giữ hồ sơ đúng và mới chấp nhận được (giờ biên tập / hồ sơ).

**Người dùng (persona, từ research K1 đến K7).**
| Mã | Persona | Kênh chính | Nhu cầu |
|---|---|---|---|
| P-OFF | Dân văn phòng trong nhóm Zalo công ty | Zalo, Messenger | Hiểu câu cả nhóm đang cười trong 60 giây |
| P-GAME | Gamer, người trong cuộc | Threads, Facebook | Được ghi nhận là "người đã biết", đóng góp nguồn |
| P-PAR | Phụ huynh có con tuổi teen | Google search, Facebook | Hiểu từ lóng của con, biết có gì đáng lo |
| P-TECH | Dân công nghệ không theo giải trí | Messenger, link bạn gửi | Bắt kịp nhanh, không phải đăng nhập |
| P-ED | Biên tập viên Toibingu (nội bộ) | Studio | Chọn chuyện, duyệt hồ sơ, sửa sai nhanh |
| P-PART | Admin page meme đối tác | Facebook page | Giảm bị hỏi lại, được ghi nguồn |

## 2. Functional Requirements (Yêu cầu chức năng)

### REQ-001 Trang chủ "Hôm nay bạn bỏ lỡ vụ gì?" (P1)
- **Goal:** Lý do mở sản phẩm hằng ngày khi chưa có câu hỏi (tình huống U1).
- **Behavior:** Trang chủ must hiển thị ô nhập (REQ-003) ở đầu và **4 đến 6** thẻ câu chuyện đã xuất bản, không mở ra ô chat trống. Tab: "Hot ngoài feed", "Cả làng đang hỏi", "Có diễn biến mới". Không yêu cầu đăng nhập. Nhãn phạm vi must là "đang hot trong các nguồn Toibingu theo dõi", không bao giờ "hot nhất Việt Nam".
- **Acceptance Criteria:** AC-001.1 Khách chưa đăng nhập xem được trang chủ và mở được mọi thẻ. AC-001.2 Chỉ story có trạng thái `published` xuất hiện. AC-001.3 Thứ tự theo điểm ưu tiên (REQ-009), không theo tổng lượt xem cộng dồn giữa nền tảng.
- **UAT:** Given khách mới trên điện thoại, When mở trang chủ, Then thấy ô dán và 4 đến 6 thẻ có nhãn phạm vi, không thấy yêu cầu đăng nhập.
- **Traceability:** Upstream: brief §3, U1, K4. Downstream: TC TBD (apps/web e2e).

### REQ-002 Thẻ câu chuyện và phản hồi 3 nút (P1)
- **Goal:** Mỗi thẻ cho biết ngay chuyện gì, hot ở đâu, vì sao đáng mở, mình thiếu đoạn nào; học sở thích **trong** Toibingu.
- **Behavior:** Thẻ must có tiêu đề dạng câu hỏi, cộng đồng nguồn và nơi đang lan, một dòng "Bạn thiếu đoạn này", và 3 nút [Kể tôi nghe] [Tôi biết rồi] [Không quan tâm]. Phản hồi must lưu theo định danh thiết bị ẩn danh, không đọc lịch sử duyệt web. "Tôi biết rồi" should hiện tỷ lệ người đã biết ("Bạn thuộc 12% đã biết vụ này") khi đủ mẫu (mặc định ≥ 50 phản hồi).
- **Acceptance Criteria:** AC-002.1 Mỗi lần bấm tạo đúng 1 sự kiện `card_feedback`. AC-002.2 "Không quan tâm" làm thẻ đó không hiện lại cho thiết bị đó trong 7 ngày. AC-002.3 Tỷ lệ "đã biết" không hiện khi mẫu dưới ngưỡng.
- **UAT:** Given thẻ đang hiển thị, When bấm "Không quan tâm", Then thẻ biến mất và không quay lại khi tải lại trang.
- **Traceability:** Upstream: brief §3, K2, K4. Downstream: TC TBD.

### REQ-003 Ô dán link / ảnh chụp / câu nói (P1)
- **Goal:** Tình huống U2: "Sao ai cũng nói câu này? Vụ gì vậy?"
- **Behavior:** Người dùng dán URL, gõ cụm từ, hoặc tải ảnh chụp màn hình. Hệ thống must tìm hồ sơ đã xuất bản khớp nhất và trả về tối đa 3 ứng viên kèm độ khớp. Nếu link không đọc được (riêng tư, bị chặn, lỗi), hệ thống must nói rõ "Tôi không đọc được link này" và mời bổ sung câu trích hoặc ảnh; AI must not giả vờ đã đọc. Nếu không có hồ sơ khớp, must ghi nhận một **context request** (dùng cho REQ-009 và REQ-012) và nói trung thực "Chưa có hồ sơ cho vụ này, bạn là người thứ N hỏi". Ảnh chụp must chỉ dùng để trích chữ (OCR) cho việc khớp, không lưu công khai.
- **Acceptance Criteria:** AC-003.1 Tỷ lệ dán ra đúng hồ sơ ≥ 70% trên bộ test có nhãn (giả thuyết pilot). AC-003.2 Link không đọc được không bao giờ sinh ra tóm tắt nội dung link. AC-003.3 Mỗi lần không khớp tạo đúng 1 context request, gộp theo cụm (REQ-009).
- **UAT:** Given một link Facebook nhóm riêng tư, When dán vào ô, Then hệ thống báo không đọc được và đề nghị dán câu trích, không hiện tóm tắt.
- **Traceability:** Upstream: brief §2 U2, §6, K1, K3. Downstream: TC TBD (packages/signals, apps/web).

### REQ-004 Hồ sơ bắt kịp (P1, lõi)
- **Goal:** Người đọc nói được "À, ra thế" trong dưới 90 giây.
- **Behavior:** Trang hồ sơ must có 6 phần theo thứ tự: Hiểu nhanh, Đoạn bạn bỏ lỡ, Vì sao đang hot, Hot ở đâu, Giải mã cách mọi người nói, Diễn biến và nguồn. Phần mặc định chỉ gồm 3 phần đầu; timeline, bài gốc và lời giải cộng đồng mở khi người đọc chọn. Hồ sơ must hiện thời điểm biên soạn, thời điểm cập nhật, biên tập viên duyệt. Nội dung "chuyện gì xảy ra" (trung lập) must tách khỏi "người ta nghĩ gì" (ý kiến, gắn nhãn).
- **Acceptance Criteria:** AC-004.1 Hồ sơ thiếu một trong 3 phần đầu không xuất bản được (publish gate, REQ-010). AC-004.2 Mọi mốc timeline phân biệt "xảy ra lúc" và "được biết đến lúc" khi có dữ liệu. AC-004.3 Trang có URL công khai ổn định dạng `/vu/<slug>`.
- **UAT:** Given hồ sơ đã xuất bản, When người đọc mở trên điện thoại, Then 3 phần đầu hiện ngay không cần cuộn ngang, kèm ngày cập nhật và nguồn.
- **Traceability:** Upstream: brief §4, research (Axios, KYM, OutOfTheLoop). Downstream: `packages/domain` CatchUpDossier, `checkPublishGate` tests.

### REQ-005 Nhãn xác minh của claim (P1)
- **Goal:** "Đang được bàn tán ≠ đã được xác nhận ≠ đáng tin."
- **Behavior:** Mỗi khẳng định (claim) trong hồ sơ must mang một trong 4 nhãn: Đang lan truyền (chưa xác minh), Đã xác nhận, Còn tranh cãi, Đã bị bác bỏ. Claim "Đã xác nhận" must có ít nhất 1 nguồn. Lượt chia sẻ, lượt thích must not là đầu vào của nhãn. Hồ sơ mà "Hiểu nhanh" dựa trên claim "Đang lan truyền" must hiện băng "Đang xác minh" ở đầu trang.
- **Acceptance Criteria:** AC-005.1 Publish gate chặn claim "Đã xác nhận" không nguồn. AC-005.2 Hồ sơ phát JSON-LD `ClaimReview` cho từng claim có nhãn.
- **UAT:** Given hồ sơ có tin đồn chưa xác minh, When người đọc mở, Then thấy băng "Đang xác minh" và nhãn ở từng claim.
- **Traceability:** Upstream: brief §4, research ClaimReview. Downstream: `publish-gate.test.ts`.

### REQ-006 Lời giải cộng đồng tách riêng (P1)
- **Behavior:** Lời giải hay từ mạng xã hội must hiển thị trong khối riêng "Cộng đồng giải thích", gồm trích ngắn (≤ 280 ký tự) và link về bài gốc, do biên tập viên chọn. Số like must not là tiêu chí chọn duy nhất. Không sao chép toàn bộ bình luận, ảnh của người khác.
- **Acceptance Criteria:** AC-006.1 Trích vượt 280 ký tự bị chặn ở Studio. AC-006.2 Mọi lời giải cộng đồng trỏ tới một Source tồn tại.
- **UAT:** Given biên tập viên dán bình luận dài, When lưu, Then Studio yêu cầu rút gọn và gắn link nguồn.
- **Traceability:** Upstream: brief §4, OutOfTheLoop rules. Downstream: `publish-gate.test.ts` (dangling source).

### REQ-007 Thẻ chia sẻ (P1)
- **Goal:** Vòng lan truyền: thiếu bối cảnh, nhận lời giải đáng gửi, gửi nhóm, người mới mở, mang tới chuyện khác.
- **Behavior:** Mỗi hồ sơ must có ảnh xem trước 1200×630 (Open Graph) chứa tiêu đề, **một câu Hiểu nhanh** (thông tin thật, không chỉ câu giật tò mò), ngày biên soạn và tên miền. Nút chia sẻ must có: Zalo, Messenger, sao chép link, chia sẻ hệ thống (Web Share API). Câu kèm theo chọn từ bộ câu thương hiệu ("Bạn không ngu. Bạn thiếu tập 1. Đây là tập 1.", "Tôi đã được thông não vụ này. Đến lượt bạn."). Link chia sẻ must gắn mã giới thiệu ẩn danh để đo khách mới / lần chia sẻ. Hồ sơ có băng "Đang xác minh" must hiện nhãn này trên ảnh chia sẻ.
- **Acceptance Criteria:** AC-007.1 Ảnh hiển thị đúng dấu tiếng Việt (dấu chồng) trên bộ chuỗi kiểm thử. AC-007.2 Xem trước link trên Zalo và Messenger hiển thị ảnh và tiêu đề (kiểm thử thủ công, ghi bằng chứng).
- **UAT:** Given hồ sơ đã xuất bản, When bấm chia sẻ Zalo, Then người nhận thấy ảnh có câu Hiểu nhanh và mở được hồ sơ không cần đăng nhập.
- **Traceability:** Upstream: brief §8, research vòng #1. Downstream: TC TBD (apps/web og route).

### REQ-008 Phản hồi trên hồ sơ (P1)
- **Behavior:** Cuối phần mặc định must có 3 nút: "Hiểu rồi", "Vẫn chưa hiểu", "Sai thông tin". "Sai thông tin" must cho nhập ghi chú và link (tùy chọn) và tạo một mục trong hàng chờ sửa sai của Studio. "Vẫn chưa hiểu" should hỏi "Bạn còn thiếu đoạn nào?" (tùy chọn).
- **Acceptance Criteria:** AC-008.1 "Hiểu rồi" ghi sự kiện `dossier_understood` dùng cho North Star. AC-008.2 Báo sai tạo mục hàng chờ có SLA hiển thị (mục tiêu xử lý < 24 giờ).
- **UAT:** Given người đọc thấy thông tin sai, When bấm "Sai thông tin" và gửi, Then nhận xác nhận "Đã chuyển biên tập viên" và mục xuất hiện ở Studio.
- **Traceability:** Upstream: brief §9. Downstream: TC TBD.

### REQ-009 Bộ máy chọn chuyện (P1)
- **Goal:** Luôn có chuyện đáng xem mà không cào toàn bộ mạng xã hội.
- **Behavior:**
  - Nguồn P1 must chỉ gồm: Threads keyword/topic search API chính thức (khi được duyệt quyền `threads_keyword_search`), Google Trends RSS realtime, link người dùng gửi (REQ-003), link biên tập viên thêm. Thu thập tự động trái điều khoản nền tảng must not được dùng.
  - Tín hiệu lớp 1 (đang nổi): tốc độ tăng thảo luận so với baseline **của chính nguồn đó**, số cộng đồng khác nhau có xuất hiện, truy vấn tìm kiếm tăng.
  - Tín hiệu lớp 2 (thiếu bối cảnh): số người độc lập gửi cùng chuyện, câu xin bối cảnh ("vụ gì vậy", "ai tóm tắt giúp", "xin nguồn", "tôi bỏ lỡ đoạn nào", "sao mọi người cười", "ai giải thích hộ", "tôi bị ngu"), tỷ lệ "Kể tôi nghe" và "Vẫn chưa hiểu".
  - Bài trùng / repost must gộp trước khi đếm; nhiều bài cùng chuyện gộp về 1 story candidate.
  - Ưu tiên = đang nóng + nhu cầu bối cảnh + liên quan. Độ tin cậy must not là trọng số ưu tiên; nó là điều kiện xuất bản (REQ-010).
- **Acceptance Criteria:** AC-009.1 20 repost trong một cộng đồng không làm tăng điểm nóng so với 1 bài (test `ranking.test.ts`). AC-009.2 Chuyện lan ở nhiều cộng đồng xếp trên chuyện cùng độ nóng ở một cộng đồng. AC-009.3 Chuyện nóng nhưng không ai cần giải thích xếp dưới chuyện ấm mà nhiều người hỏi. AC-009.4 Bộ nhận diện câu xin bối cảnh khớp cả viết có dấu và không dấu.
- **UAT:** Given 30 người dùng gửi cùng một cụm từ trong 1 giờ, When biên tập viên mở Studio, Then story candidate đó nằm trong top 5 hàng chờ.
- **Traceability:** Upstream: brief §5, research (river, Kleinberg, datasketch, Threads API). Downstream: `ranking.test.ts`, `packages/signals` tests.

### REQ-010 Studio biên tập và cổng xuất bản (P1)
- **Behavior:** Biên tập viên (đăng nhập, phân quyền) must có: hàng chờ candidate theo ưu tiên; soạn hồ sơ với bản nháp AI (AI chỉ soạn, không xuất bản; mọi câu nháp must trỏ tới source id hoặc bị đánh dấu "chưa có nguồn"); duyệt; xuất bản; cập nhật phiên bản; nhật ký sửa sai công khai trên hồ sơ. Xuất bản must qua publish gate: đủ 3 phần đầu, có nguồn, claim "Đã xác nhận" có nguồn, không có nguồn từ nhóm riêng tư, không tham chiếu nguồn không tồn tại, có người duyệt. Tự động xuất bản là NOW-NOT.
- **Acceptance Criteria:** AC-010.1 Không có đường nào xuất bản hồ sơ khi `checkPublishGate().ok = false`. AC-010.2 Mỗi phiên bản hồ sơ lưu người duyệt và thời điểm. AC-010.3 Nháp AI không có source id bị đánh dấu trực quan.
- **UAT:** Given hồ sơ chưa được duyệt, When biên tập viên bấm Xuất bản, Then hệ thống từ chối và liệt kê lý do.
- **Traceability:** Upstream: brief §5, research Artifact (kiểm duyệt). Downstream: `publish-gate.test.ts`.

### REQ-011 Có diễn biến mới và theo dõi vụ (P1)
- **Behavior:** Khi story hot trở lại, hồ sơ must hiện khối "Có gì mới so với lần trước" (ngày, điểm khác, lý do hot lại) và lên tab "Có diễn biến mới". Người đọc can bấm "Theo dõi vụ này" mà không đăng nhập (lưu cục bộ trên thiết bị); trang chủ should ưu tiên vụ đang theo dõi khi có cập nhật.
- **Acceptance Criteria:** AC-011.1 Hồ sơ hot lại giữ nguyên URL, có lịch sử phiên bản. AC-011.2 Theo dõi không cần tài khoản.
- **UAT:** Given người đọc theo dõi một vụ, When vụ có cập nhật và họ mở trang chủ, Then thấy vụ đó gắn nhãn "Có diễn biến mới".
- **Traceability:** Upstream: brief §2 U3, K3. Downstream: TC TBD.

### REQ-012 "Top vụ cả làng chưa hiểu" và trang SEO (P1)
- **Behavior:** Bảng xếp hạng **vụ** (không xếp người) theo số người độc lập xin bối cảnh trong 7 ngày, chỉ gồm vụ đã có hồ sơ. Mỗi hồ sơ must có tiêu đề SEO dạng "Vụ X là gì?" hoặc "X là gì?", mô tả bằng câu Hiểu nhanh, sitemap, ngày cập nhật.
- **Acceptance Criteria:** AC-012.1 Bảng không hiện tên, nickname hay số liệu cá nhân của ai. AC-012.2 Trang hồ sơ trả HTML render sẵn (đọc được khi tắt JavaScript).
- **UAT:** Given tìm Google "vụ X là gì", When mở kết quả Toibingu, Then đọc được phần Hiểu nhanh ngay.
- **Traceability:** Upstream: brief §7, research vòng #2. Downstream: TC TBD.

### REQ-013 Đo lường sản phẩm (P1)
- **Behavior:** Hệ thống must ghi các sự kiện ẩn danh: `home_view`, `card_feedback`, `intake_submitted`, `intake_matched`, `dossier_view`, `dossier_default_read`, `dossier_understood`, `dossier_confused`, `dossier_wrong_info`, `share_clicked`, `share_landing` (kèm mã giới thiệu), `follow_story`. Dashboard pilot must hiện North Star và các chỉ số ở mục 9.
- **Acceptance Criteria:** AC-013.1 Không sự kiện nào chứa nội dung người dùng gõ ngoài mã băm cụm. AC-013.2 Khách mới / lần chia sẻ tính được từ dữ liệu sự kiện.
- **Traceability:** Upstream: brief §9, research §6. Downstream: TC TBD.

### REQ-014 Quiz tuần "Hội tối cổ" (P2)
- **Behavior:** Mỗi tuần 1 bộ 5 câu về các vụ đã có hồ sơ; tham gia tự nguyện; nickname tùy chọn; kết quả là biệt danh tự giễu và lưới ô vuông không lộ đáp án (kiểu Wordle). Không bao giờ công khai ai không biết vụ gì.
- **Traceability:** Upstream: brief §7, K5. Ghi chú: research đề xuất đưa vào P1; brief giữ ở P2. Xem Open Questions Q-04.

### REQ-015 Extension Chrome / Cốc Cốc (P2)
- **Behavior:** Bôi đen câu hoặc chuột phải vào link, chọn "Tôi bị ngu vụ này", mở lời giải ở side panel (fallback popup nếu trình duyệt không hỗ trợ). Chỉ dùng quyền `activeTab` và `contextMenus`; must báo rõ phần nội dung nào được gửi; không đọc feed nền.
- **Traceability:** Upstream: brief §6, K6, research (WXT, sidepanel-dictionary).

### REQ-016 "Thánh thông não" và đóng góp cộng đồng (P2)
- **Behavior:** Người dùng gửi lời giải, nguồn bổ sung, sửa sai; mọi đóng góp qua hàng chờ biên tập. Điểm dựa trên đóng góp **được duyệt** và **được đánh giá hữu ích bởi người từ nhiều cộng đồng** (mô hình bridging kiểu Community Notes), không dựa trên số lượng. Owner chốt 2026-10-16: không cần ý kiến pháp lý trước khi mở (Q-01 đã đóng). "Thánh thông não" và "Hội tối cổ" là từ khóa thương hiệu (REQ-017).
- **Traceability:** Upstream: brief §7, research Community Notes.

### REQ-017 Engine từ lóng và trend sống (P1)
- **Goal:** Luôn biết cộng đồng đang nói gì và chữ đó nghĩa là gì, trên nhiều nền tảng (Threads, TikTok, Facebook, YouTube, Google Trends), để phần "Giải mã cách mọi người nói" (REQ-004), ô dán (REQ-003) và trang "X là gì" (REQ-012) luôn mới.
- **Behavior:**
  - Hệ thống must giữ một **lexicon** gồm từ lóng, câu cửa miệng, biệt danh, hashtag và **từ khóa thương hiệu** ("Tôi bị ngu", "Hội tối cổ", "Thánh thông não"). Mỗi mục có dạng viết chuẩn có dấu, các biến thể (không dấu, teen code), nghĩa trung lập ≤ 200 ký tự, cộng đồng, nền tảng, nguồn, câu chuyện liên quan.
  - Phát hiện từ mới must dựa trên: cụm người dùng hỏi "X là gì" (ô dán, câu xin bối cảnh từ nguồn được phép), mức tăng dùng so với baseline của chính từ đó, số cộng đồng xuất hiện. Đếm theo **người hỏi độc lập**, không theo số tin nhắn.
  - Trạng thái nóng (`emerging`, `hot`, `fading`, `dormant`) must được tính tự động; trạng thái duyệt (`pending`, `approved`, `rejected`) must do biên tập viên quyết. Từ chưa duyệt must not hiện ở bất kỳ bề mặt công khai nào, dù đang nóng.
  - Cụm mà bỏ dấu sẽ trùng chữ thường ("tối cổ" và "tôi có", "Hội tối cổ" và "hỏi tôi có") must chỉ khớp theo dạng có dấu.
  - Một quy trình vận hành (skill `toibingu-trend-scout`) must chạy định kỳ: gom tín hiệu từ nguồn được phép, đề xuất mục mới hoặc cập nhật kèm nguồn, ghi vào hàng chờ đề xuất; không tự duyệt.
  - Từ nhạy cảm (xúc phạm, nhắm vào cá nhân) must được gắn cờ `sensitive`, chỉ giải thích trung lập, không lên trang chủ, không nêu tên người bị nhắm.
- **Acceptance Criteria:** AC-017.1 Từ chưa duyệt không bao giờ công khai (`trend.test.ts`). AC-017.2 Một người hỏi 20 lần chỉ tính 1 (`discover.test.ts`). AC-017.3 "hỏi tôi có" không khớp "Hội tối cổ" (`match.test.ts`). AC-017.4 Dữ liệu lexicon trong repo hợp lệ (`validateLexicon`, test dữ liệu). AC-017.5 Từ đã có trong lexicon không bị đề xuất lại.
- **UAT:** Given 5 người dùng khác nhau dán "'ét o ét' là gì", When biên tập viên mở hàng chờ, Then thấy đề xuất "ét o ét" với số người hỏi = 5 và cộng đồng; When duyệt kèm nguồn, Then ô dán khớp được cụm đó.
- **Traceability:** Upstream: owner 2026-10-16 ("cần 1 skill / engine liên tục update các từ lóng, trend hot trên các nền tảng"), brief §5, research. Downstream: SD-TBH001 (H-15, H-16), SD-TBY001 (Term), SD-TBI001 (IF-01, IF-02, IF-08 đến IF-12), `packages/lexicon` tests, `packages/signals/test/asked-terms.test.ts`.

## 3. Scope (Đối tượng phạm vi)

**P1 (MVP pilot):** REQ-001 đến REQ-013 và REQ-017. Web tối ưu điện thoại (tiếng Việt), Studio nội bộ, worker xử lý tín hiệu, 3 cộng đồng pilot: meme / văn hóa mạng, game, công nghệ. Cộng đồng giải trí can thêm khi có biên tập viên.

**P2:** REQ-014, REQ-015, REQ-016.

## 4. Out of scope (対象外)

- Quét toàn bộ mạng xã hội; thu thập tự động trái điều khoản nền tảng (NOW-NOT, không phải P2).
- Tự động xuất bản không có người duyệt (NOW-NOT).
- Cá nhân hóa sâu dựa trên lịch sử duyệt web; đăng nhập bằng mạng xã hội để đọc feed người dùng (NOW-NOT).
- Bình luận tự do công khai (NOW-NOT; bài học Artifact và Nghị định 147).
- Hệ thống cấp bậc phức tạp, streak mất trắng, phần thưởng tiền.
- Ứng dụng di động native.
- Chấm "trí thông minh" hay xếp hạng người theo mức không biết.

## 5. Non-Functional Requirements (Yêu cầu phi chức năng, WHAT)

| Mã | Nhóm | Yêu cầu |
|---|---|---|
| NFR-01 | Truy cập | Đọc mọi nội dung công khai không cần đăng nhập. |
| NFR-02 | Hiệu năng | Trang chủ và hồ sơ: LCP p75 ≤ 2,5 s trên điện thoại tầm trung mạng 4G; ô dán trả kết quả p95 ≤ 4 s (không tính OCR ảnh). |
| NFR-03 | Sẵn sàng | Web công khai ≥ 99,5%/tháng trong pilot; Studio, worker được phép bảo trì có báo trước. |
| NFR-04 | Quyền riêng tư | Không thu thập lịch sử duyệt web; định danh thiết bị ẩn danh; không lưu ảnh chụp người dùng quá 24 giờ; dữ liệu lưu trên máy của owner (Q-02 đã chốt). |
| NFR-05 | Tuân thủ nguồn | Chỉ dùng API chính thức, nội dung người dùng chủ động gửi, link biên tập viên thêm. Mọi Source ghi `accessMethod`. |
| NFR-06 | Chính xác | 0 hồ sơ phải gỡ vì sai sự thật; báo sai xử lý < 24 giờ (mục tiêu pilot). |
| NFR-07 | Khả năng truy vết | Mọi phiên bản hồ sơ truy vết được người duyệt, thời điểm, nguồn; nhật ký sửa sai công khai. |
| NFR-08 | Chi phí | Chi phí LLM + embedding trung bình ≤ một ngưỡng mỗi hồ sơ do owner đặt (Q-05); có trần chi tiêu tháng. |
| NFR-09 | Khả dụng | Văn bản tiếng Việt hiển thị đúng dấu ở web và ảnh chia sẻ; tương phản WCAG 2.1 AA cho nội dung chính. |
| NFR-10 | Bảo mật | Studio yêu cầu đăng nhập + phân quyền; bí mật (token Threads, khóa LLM) không nằm trong repo. |

## 6. Assumptions (Giả định)

- A1: Owner nộp xin quyền trên nhiều nền tảng (danh sách ở SD-TBI001 §3 và `docs/00-intake/research/platform-access.md`); nền tảng nào chưa được duyệt, P1 vẫn chạy bằng link người dùng gửi + biên tập viên + Google Trends RSS.
- A2: Pilot có 1 đến 2 biên tập viên bán thời gian; công suất mục tiêu 3 đến 5 hồ sơ mới mỗi ngày.
- A3: Quy mô pilot < 50.000 người dùng/tháng; không cần hạ tầng phân tán.
- A4: Tên miền chính `toibingu.vn`, phụ `toibingu.cc`; tình trạng đăng ký **chưa xác minh**.
- A5: Các mục tiêu số ở mục 9 là giả thuyết pilot, sẽ hiệu chỉnh sau 2 tuần dữ liệu.

## 7. Open questions (未確定事項)

| No | Content | Owner | Priority |
|---|---|---|---|
| Q-01 | ĐÃ CHỐT 2026-10-16: không hỏi luật sư trước khi mở REQ-016 (Nghị định 147/2024). | Owner | Closed |
| Q-02 | ĐÃ CHỐT 2026-10-16: dữ liệu lưu trên máy local của owner (SD-TBH001 H-14). | Owner | Closed |
| Q-03 | Tên miền `toibingu.vn` / `.cc` còn đăng ký được không; ai đứng tên? Owner hoãn 2026-10-16. | Owner | Low |
| Q-04 | ĐÃ CHỐT 2026-10-16: quiz "Hội tối cổ" ở P2. | Owner | Closed |
| Q-05 | Ngân sách LLM/embedding tháng và trần chi phí mỗi hồ sơ. | Owner | Medium |
| Q-06 | Hồ sơ "Đang xác minh" được chia sẻ có nhãn (mặc định) hay chặn chia sẻ hoàn toàn? | Owner + biên tập | Medium |
| Q-07 | Page meme đối tác nào thử nghiệm (K7), điều khoản ghi nguồn hai chiều? | Owner | Low |

## 8. Customer confirmation (顧客確認事項)

- [ ] Owner xác nhận phạm vi P1 = REQ-001 đến REQ-013 và REQ-017.
- [ ] Owner xác nhận North Star và ngưỡng chuyển P2 ở mục 9.
- [x] Owner trả lời Q-01, Q-02 (2026-10-16).
- [ ] Owner xác nhận nguyên tắc: độ tin cậy là cổng xuất bản, không phải trọng số xếp hạng.

## 9. Success metrics (Chỉ số pilot, giả thuyết)

| Chỉ số | Mục tiêu giả thuyết | Nguồn đo |
|---|---|---|
| North Star: lượt "thông não" thành công / tuần | tăng tuần sau so với tuần trước trong 6/8 tuần | `dossier_understood` |
| Dán ra đúng hồ sơ | ≥ 70% | `intake_matched` / bộ test có nhãn |
| Chia sẻ / lượt đọc xong | ≥ 8% | `share_clicked` / `dossier_default_read` |
| Khách mới / lần chia sẻ | ≥ 0,3 | `share_landing` |
| D7 return | ≥ 15% | định danh ẩn danh |
| "Không quan tâm" / thẻ hiển thị | ≤ 25% | `card_feedback` |
| Giờ biên tập / hồ sơ | owner đặt sau tuần 2 | Studio |
| Hồ sơ gỡ vì sai sự thật | 0 | nhật ký sửa sai |

Ngưỡng chuyển P2: đạt ≥ 4/7 chỉ số đầu trong 2 tuần liên tiếp, và chỉ số cuối = 0.

## 10. Traceability Matrix

| REQ | Upstream | UAT | Downstream (SD / test) | Confirmed |
|---|---|---|---|---|
| REQ-001 | brief §3, U1, K4 | có | SD-TBH001, SD-TBN001 | Chưa |
| REQ-002 | brief §3, K2, K4 | có | SD-TBY001 | Chưa |
| REQ-003 | brief §2, §6, K1, K3 | có | SD-TBH001, SD-TBI001 | Chưa |
| REQ-004 | brief §4 | có | SD-TBY001, `publish-gate.test.ts` | Chưa |
| REQ-005 | brief §4 | có | SD-TBP001, `publish-gate.test.ts` | Chưa |
| REQ-006 | brief §4 | có | SD-TBP001, `publish-gate.test.ts` | Chưa |
| REQ-007 | brief §8 | có | SD-TBH001, SD-TBI001 | Chưa |
| REQ-008 | brief §9 | có | SD-TBY001 | Chưa |
| REQ-009 | brief §5 | có | SD-TBH001, SD-TBI001, `ranking.test.ts` | Chưa |
| REQ-010 | brief §5 | có | SD-TBH001, SD-TBP001, `publish-gate.test.ts` | Chưa |
| REQ-011 | brief §2 U3 | có | SD-TBY001 | Chưa |
| REQ-012 | brief §7 | có | SD-TBH001 | Chưa |
| REQ-013 | brief §9 | không | SD-TBY001, SD-TBN001 | Chưa |
| REQ-014 | brief §7 | P2 | TBD | Chưa |
| REQ-015 | brief §6 | P2 | SD-TBX001 | Chưa |
| REQ-016 | brief §7 | P2 | TBD | Chưa |
| REQ-017 | owner 2026-10-16, brief §5 | có | SD-TBH001, SD-TBY001, SD-TBI001, SD-TBP001, `packages/lexicon` tests | Chưa |
