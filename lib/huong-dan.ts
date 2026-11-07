// Nội dung trang Hướng dẫn (sửa chữ ở đây)
export interface MucHD { hoi: string; dap: string }

export const HD_HOC_SINH: MucHD[] = [
  { hoi: "Đăng nhập lần đầu thế nào?", dap: "1. Nhập Mã học sinh (ví dụ HS001) và mật khẩu tạm thầy phát.\n2. Hệ thống yêu cầu đặt mật khẩu mới: ít nhất 6 ký tự, có chữ và số.\n3. Em chỉ tự đổi được MỘT lần này, nên hãy ghi nhớ cẩn thận." },
  { hoi: "Quên mật khẩu thì làm sao?", dap: "Ở trang đăng nhập bấm \"Quên mật khẩu?\", nhập mã học sinh rồi gửi. Thầy sẽ cấp mật khẩu tạm mới, em đăng nhập và đặt lại mật khẩu riêng." },
  { hoi: "Nộp bài như thế nào?", dap: "Vào Buổi học → chọn buổi → tab Bài tập → Làm bài.\n• Soạn thảo code: gõ code trong ô màu tối (tự lưu nháp vài giây một lần).\n• Upload file: kéo thả hoặc bấm Chọn file.\nBấm Nộp bài → xác nhận. Màn hình hiện \"Nộp bài thành công!\" là xong." },
  { hoi: "Nộp lại được không?", dap: "Được, khi bài đang \"Đã nộp – chờ chấm\" hoặc \"Cần nộp lại\". Bài mới sẽ THAY bài cũ, thầy chỉ xem bài mới nhất. Khi thầy đã chấm thì bài bị khóa; nếu cần sửa, em nhờ thầy \"Mở cho nộp lại\"." },
  { hoi: "Đúng hạn / Trễ / Không nộp bài nghĩa là gì?", dap: "Hệ thống xét theo giờ em nộp LẦN ĐẦU:\n• Đúng hạn: nộp trước hạn.\n• Trễ: nộp sau hạn (vẫn được chấm).\n• Không nộp bài: đã qua hạn mà chưa nộp.\nNộp lại sau đó không làm đổi nhãn này." },
  { hoi: "Em không làm được bài thì sao?", dap: "Tích ô \"🙋 Em chưa làm được bài này\" và ghi ngắn em kẹt ở đâu. Thầy sẽ thấy và hỗ trợ em. Em vẫn có thể nộp phần đã làm được." },
  { hoi: "Gõ code trên điện thoại khó quá?", dap: "Dùng hàng phím nhanh phía trên ô code (⇥ thụt lề, dấu : ( ) \" [ ]). Hoặc soạn trên máy tính, lưu file .py rồi dùng tab Upload file." },
  { hoi: "Tài liệu không mở được?", dap: "File PDF và ảnh có nút Xem. File Word/PowerPoint/Excel cần tải về để mở. Nếu vẫn lỗi, em báo thầy." },
];

export const HD_GIAO_VIEN: MucHD[] = [
  { hoi: "Bắt đầu một năm học mới", dap: "1. Chương trình học → Nhập từ Excel (hoặc tạo tay).\n2. Quản lý lớp → Thêm lớp.\n3. Chương trình học → Áp dụng cho lớp: chọn ngày bắt đầu + thứ học.\n4. Học sinh → Nhập từ Excel/CSV → phát bảng mật khẩu tạm cho các em." },
  { hoi: "Giao bài và đặt hạn nộp", dap: "Chương trình học → bấm Sửa ở buổi → mục Bài tập → Thêm bài tập. Trong trang bài tập, đặt Hạn nộp cho từng lớp." },
  { hoi: "Chấm bài nhanh", dap: "Bài tập → Hàng đợi chấm → Chấm tiếp. Nhập điểm, bấm nhận xét mẫu, \"Lưu & bài tiếp theo\". Nếu học sinh vừa nộp bản mới, hệ thống sẽ cảnh báo." },
  { hoi: "Nhắc phụ huynh qua Zalo", dap: "Báo cáo → lọc \"Cần nhắc phụ huynh\" → Sao chép tin → mở Zalo dán gửi → tích \"Đã nhắc\". Hệ thống không lưu số điện thoại phụ huynh." },
  { hoi: "Học sinh quên mật khẩu", dap: "Chuông có chấm đỏ. Vào Học sinh → Yêu cầu mật khẩu → Reset. Mật khẩu tạm chỉ hiện MỘT lần: sao chép hoặc tải CSV ngay." },
  { hoi: "Lỡ xóa nhầm", dap: "Cài đặt → Thùng rác → Khôi phục (trong 30 ngày)." },
  { hoi: "Sao lưu dữ liệu", dap: "Báo cáo → Bảng điểm → Tải Excel. Nên làm cuối mỗi tháng." },
];
