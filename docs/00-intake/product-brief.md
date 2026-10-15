# Product brief — Toibingu

> Nguồn: ý tưởng gốc của owner (2026-10). Đây là đầu vào cho Requirement Design; khi mâu thuẫn, requirement + SD là bản sống.

## 1. Định vị
- **Toibingu — Bắt kịp chuyện đang hot ngoài feed của bạn.**
- Tagline: *"Không phải tôi ngu. Tôi chưa xem tập trước."*
- Insight: người dùng không thiếu khả năng hiểu; họ thiếu **"tập trước"** — chuyện chưa đi qua feed của họ. **Khác kênh, không phải khác năng lực.**
- Toibingu là sản phẩm **bắt kịp bối cảnh xã hội**: tin hot là đầu vào, **hồ sơ giải thích là giá trị lõi**, chất tự trào là cách lan truyền. Không phải chatbot dạy người ta thông minh hơn.
- "Tôi bị ngu" là meme tự trào = "tôi không hiểu, ai giải thích giúp". Người khởi xướng trend: **chưa xác minh**.

## 2. Ba tình huống sử dụng
| # | Trong đầu người dùng | Toibingu làm |
|---|---|---|
| U1 Chưa biết có chuyện gì | "Hôm nay thiên hạ nói chuyện gì mà mình chưa biết?" | Chủ động đưa chuyện hot, đặc biệt từ cộng đồng họ ít theo dõi — **lý do mở hằng ngày** |
| U2 Đã thấy, thiếu bối cảnh | "Sao ai cũng nói câu này? Vụ gì vậy?" | Nhận link / ảnh chụp / câu nói → tìm đúng câu chuyện → giải thích phần thiếu |
| U3 Biết sơ, muốn bắt kịp | "Sao hôm nay lại bị nhắc tiếp?" | Diễn biến mới, lý do hot lại, khác gì lần trước |

- Đơn vị nội dung = **một câu chuyện cần bắt kịp**, không phải một bài đăng. 20 bài cùng chuyện → 1 hồ sơ.
- "Ngoài feed" ≠ "ngoài sở thích": ưu tiên chuyện từ cộng đồng khác **nhưng đủ liên quan** để người dùng có khả năng gặp/muốn biết.

## 3. Trang chủ
- Không mở ra ô chat trống. Tiêu đề: **"Hôm nay bạn bỏ lỡ vụ gì?"** + ô dán link / ảnh / câu.
- Tab: **Hot ngoài feed · Cả làng đang hỏi · Có diễn biến mới · Hội tối cổ**.
- Thẻ câu chuyện trả lời: **chuyện gì — hot ở đâu — vì sao đáng mở — mình thiếu đoạn nào**; 3 nút **[Kể tôi nghe] [Tôi biết rồi] [Không quan tâm]** (học sở thích trong Toibingu, không đọc lịch sử lướt web).

## 4. Hồ sơ bắt kịp (lõi)
Hiểu nhanh · Đoạn bạn bỏ lỡ · Vì sao đang hot · Hot ở đâu · Giải mã cách mọi người nói · Diễn biến và nguồn.
- Mặc định đủ để nói "À, ra thế"; sâu hơn mới mở timeline/bài gốc.
- **Đang được bàn tán ≠ đã được xác nhận ≠ đáng tin.** Lời đồn được giải thích nhưng gắn nhãn "chưa xác minh"; lượt chia sẻ không phải bằng chứng.
- Tách **bản giải thích Toibingu biên soạn** và **lời giải thích đáng đọc từ cộng đồng** (dẫn về bài gốc, không sao chép toàn bộ; nhiều like ≠ đúng).
- Tài sản tích lũy = **hồ sơ có nguồn, được cập nhật**, không phải câu trả lời AI rời rạc.

## 5. Bộ máy chọn chuyện
- Lớp 1 — đang nổi: tốc độ tăng thảo luận trong nguồn được phép, xuất hiện ở nhiều cộng đồng, truy vấn tăng (Google Trends = tín hiệu bổ sung, không phải bảng xếp hạng social), đề cử người dùng.
- Lớp 2 — thiếu bối cảnh: số người độc lập gửi link hỏi, câu xin giải thích ("Vụ gì vậy?", "Ai tóm tắt giúp?", "Xin nguồn", "Tôi bỏ lỡ đoạn nào?", "Sao mọi người cười?", "Ai giải thích hộ?"), tỷ lệ "chưa biết", hỏi lại.
- **Ưu tiên = đang nóng + nhu cầu bối cảnh + liên quan. Điều kiện xuất bản = đủ nguồn + đạt kiểm duyệt.** Không gộp độ tin cậy vào điểm để tương tác lấn át. Không cộng cơ học lượt xem giữa nền tảng; so mức tăng trong từng nguồn/cộng đồng.
- Dữ liệu: Threads keyword/topic search API (cần token, quyền — khả thi cần kiểm chứng); chính sách Meta về thu thập tự động → **không** giả định "công khai thì cứ cào". Bản đầu = nguồn được phép + người dùng gửi link + biên tập viên chọn. Nhãn trung thực: **"đang hot trong các nguồn Toibingu theo dõi"**.

## 6. Kênh
- **Web tối ưu điện thoại = cửa vào chính.** Không bắt đăng nhập để đọc, không bắt cài extension. Luồng: copy link → dán → đúng hồ sơ → hiểu → gửi lại. Link không đọc được → nói rõ, cho bổ sung trích dẫn/ảnh; AI không giả vờ đã đọc.
- **Extension Chrome/Cốc Cốc (sau):** bôi đen / chuột phải / bấm icon → "Tôi bị ngu vụ này" → lời giải bên cạnh. Dùng `activeTab`; chỉ xử lý phần người dùng chủ động chọn, báo rõ phần nào được gửi; không biến nội dung nhóm riêng tư thành hồ sơ công khai. Kiểm thử riêng trên Cốc Cốc.

## 7. Bảng xếp hạng (sau)
| Bảng | Xếp hạng | Vai trò |
|---|---|---|
| Top vụ cả làng chưa hiểu | Câu chuyện có nhiều người độc lập xin bối cảnh | Phát hiện nhu cầu, tạo tò mò |
| Hội tối cổ | Thử thách bắt trend, tự nguyện, dùng biệt danh | Trò chơi tự trào để chia sẻ |
| Thánh thông não | Người đóng góp lời giải hữu ích, bổ sung nguồn, sửa sai | Nâng chất lượng |
- Không chấm trí thông minh; chỉ chấm mức bắt kịp một tập chuyện công bố rõ. Không thưởng thuần số lượng.

## 8. Vòng chia sẻ
Thiếu bối cảnh → lời giải đáng gửi → chia sẻ nhóm → người mới đọc → mang tới chuyện khác.
Copy: *"Tôi đã được thông não vụ này. Đến lượt bạn."* · *"Bạn không ngu. Bạn thiếu tập 1. Đây là tập 1."* Thẻ chia sẻ phải chứa thông tin hữu ích thật, link về hồ sơ có thời điểm biên soạn + nguồn.

## 9. Phạm vi
- **Lõi bắt buộc (MVP):** trang chuyện hot có người tuyển chọn; hồ sơ có nguồn; nhận link/câu hỏi; chia sẻ; phản hồi hiểu rồi / chưa hiểu / sai thông tin.
- **Sau khi chứng minh lõi:** extension, bảng đóng góp, thử thách Hội tối cổ.
- **Chưa đầu tư:** quét toàn bộ social, cá nhân hóa sâu, tự động xuất bản, hệ thống cấp bậc phức tạp.
- Pilot: vài cộng đồng khác nhau (meme–văn hóa mạng, game, công nghệ). Câu hỏi kiểm chứng: **người ở cộng đồng A có thấy hồ sơ về chuyện ở cộng đồng B đáng đọc và đáng gửi không?**
- 4 điều đo trước khi mở rộng: hiểu hơn thật không · chia sẻ có kéo người mới · có quay lại khi không có câu hỏi · công vận hành để giữ hồ sơ đúng & mới.

## 10. Tên miền
`toibingu.vn` (chính, đề xuất) · `toibingu.cc` (phụ). Tình trạng đăng ký: **CHƯA XÁC MINH** (tra VNNIC / RDAP Verisign chưa trả kết quả đọc được, 2026-10-16 theo brief).
