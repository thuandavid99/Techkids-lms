# Danh sách kiểm thử thủ công

Đánh dấu [x] khi đạt. Cần 2 trình duyệt (hoặc 1 tab ẩn danh): một cho **giáo viên**, một cho **học sinh** (nên dùng điện thoại).

## A. Đăng nhập & tài khoản
- [ ] GV đăng nhập bằng tài khoản tạo từ `npm run create-teacher`.
- [ ] GV thêm lớp, thêm 1 học sinh → bảng mật khẩu tạm hiện **một lần**; tải lại trang thì không còn.
- [ ] GV nhập danh sách HS từ Excel → xem trước → xác nhận → bảng mật khẩu tạm.
- [ ] HS đăng nhập bằng **mã HS** + mật khẩu tạm → bị chuyển sang **Đổi mật khẩu lần đầu**; thử gõ đường dẫn khác (`/buoi-hoc`) vẫn bị chặn.
- [ ] Sau khi đổi: vào trang chủ; trong Cài đặt **không có** đổi mật khẩu, **không có** SĐT phụ huynh.
- [ ] Đăng xuất → Quên mật khẩu → gửi yêu cầu → GV thấy **chấm đỏ** → Reset → mật khẩu tạm mới → HS đăng nhập lại phải đổi lần nữa.
- [ ] Gõ sai mật khẩu nhiều lần không bị khóa tài khoản (đúng spec).

## B. Chương trình học (GV)
- [ ] Nhập `ppct.xlsx`: ghép cột Buổi/Bài/Nội dung/Tài liệu → xem trước dạng cây + cảnh báo → xác nhận. Kiểm tra: nhãn "10,11" → "10–11"; dòng tô màu = kết thúc module; ô hyperlink → tài liệu dạng link; loại buổi Ôn tập/Kiểm tra nhận đúng.
- [ ] Thêm module, thêm buổi chèn trước/sau, kéo thả đổi thứ tự (cả bằng bàn phím), nhân bản, gộp/tách, xóa (hộp xác nhận nêu số tài liệu/bài tập/bài nộp; gợi ý Ẩn).
- [ ] Xuất Excel → mở được bằng Excel.
- [ ] Áp dụng cho lớp; dời lịch; đánh dấu đã dạy; hẹn giờ mở.
- [ ] Sửa buổi đã áp dụng cho ≥2 lớp → hỏi **Tất cả lớp / Chỉ lớp này**; chọn "Chỉ lớp này" → lớp kia không đổi.
- [ ] Soạn Kiến thức bằng Markdown, chèn khối code, xem trước; gõ `<script>alert(1)</script>` → hiện thành chữ, không chạy.
- [ ] Xem thử như học sinh.
- [ ] Trên điện thoại: Chương trình học hiện dạng thẻ.

## C. Bài tập & nộp bài
- [ ] Tạo bài tập (code + file), hạn nộp theo lớp, hệ số, học kỳ, bắt buộc/tùy chọn.
- [ ] HS: danh sách buổi có nhóm module, tìm kiếm, lọc; buổi chưa mở không thấy.
- [ ] HS làm bài code: gõ → đóng tab → mở lại: **nháp còn**.
- [ ] Nộp → hộp xác nhận → màn "Đã nộp – chờ thầy chấm" (không có điểm). Bấm Nộp 2 lần nhanh → chỉ 1 lần nộp.
- [ ] Nộp lại → hộp "Bài mới sẽ thay bài cũ…" → "Đã nộp 2 lần – bản mới nhất lúc …"; GV chỉ thấy 1 bản.
- [ ] Upload file sai loại (đổi đuôi .exe thành .py) / quá dung lượng → báo lỗi tiếng Việt.
- [ ] Đổi giờ máy HS → giờ nộp vẫn theo server.
- [ ] Nộp sau hạn → nhãn **Trễ**; không nộp tới hết hạn → **Không nộp bài** (đỏ); gia hạn riêng 1 bạn → bạn đó chưa bị đỏ; miễn nộp → không tính vào %.
- [ ] Bài **tùy chọn** không vào % hoàn thành và không vào danh sách nhắc PH.
- [ ] Tích "Em chưa làm được" + ghi chú → GV thấy ở tab **Cần hỗ trợ** + huy hiệu 🙋 trên ma trận.

## D. Chấm bài (GV)
- [ ] Hàng đợi chấm → Chấm → nhập điểm, nhận xét mẫu → Lưu & bài tiếp theo; Bỏ qua bài này.
- [ ] Mở màn chấm; HS nộp bản mới; GV bấm Lưu → hộp "Học sinh vừa nộp bản mới hơn…" → Tải lại bản mới.
- [ ] Cần nộp lại (có hạn nộp lại) → HS thấy thông báo, nộp lại được; quá hạn nộp lại → báo đúng.
- [ ] Sửa điểm đã chấm → hiện cũ → mới; Nhật ký thay đổi có dòng trước/sau.
- [ ] Code HS có `<b>` hiển thị nguyên văn.

## E. Theo dõi & báo cáo
- [ ] Ma trận tiến độ: màu ô đúng chú giải; menu "⋯" (Miễn nộp, Đã nộp ngoài hệ thống, Gia hạn riêng, Nộp hộ, Mở cho nộp lại); cuộn ngang trên điện thoại.
- [ ] Tình hình nộp bài theo buổi: lọc nhãn; sang Nhắc phụ huynh.
- [ ] Báo cáo & Nhắc PH: mỗi bạn 1 tin gom đủ bài; Sao chép tin (dán thử vào Zalo); Đã nhắc ghi ngày giờ.
- [ ] Bảng điểm: TB có hệ số đúng (tự tính tay 1 bạn để so); Tải Excel.
- [ ] Phiếu tiến độ → In → Lưu PDF: 1 trang gọn, không có menu.
- [ ] Nhập điểm từ Excel: xem trước + cảnh báo mã HS không tồn tại.
- [ ] Thông báo lớp: đăng → HS có chuông đỏ; Đánh dấu tất cả đã đọc.

## F. An ninh
- [ ] HS gõ `/gv` → trang "Không có quyền".
- [ ] HS A không xem được bài nộp / điểm của HS B (thử đổi id trên đường dẫn).
- [ ] Link tải file hết hạn sau vài phút.
- [ ] Mở công cụ nhà phát triển (F12) → Sources: tìm chữ `service_role` → **không có**.
- [ ] Supabase Storage: 3 bucket không Public.

## G. Thùng rác & trạng thái
- [ ] Xóa buổi → vào Thùng rác → Khôi phục; Xóa vĩnh viễn (cảnh báo "Không thể khôi phục"); Làm sạch.
- [ ] Mỗi màn: đang tải (khung xương), rỗng (hình + gợi ý), lỗi (tắt mạng → Thử lại), 404 (`/abc`).
