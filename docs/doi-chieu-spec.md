# Đối chiếu với spec v6

✅ Đã làm · 🟡 Làm một phần / làm khác spec (có lý do) · ❌ Chưa làm
**Lưu ý chung:** mọi mục ✅ là "đã viết mã + đã kiểm thử phần logic/SQL"; **giao diện chưa chạy thử trong trình duyệt** vì chưa `npm install` được (xem PROGRESS.md).

## Mục 5 — Quy trình & trạng thái
| Mục | Trạng thái | Ghi chú |
|---|---|---|
| 5.1 Trạng thái bài nộp | ✅ | `lib/domain/status.ts` + view `v_bai_hoc_sinh`; test `tests/status.test.ts` |
| 5.2 Cần nhắc phụ huynh | ✅ | gom theo HS, bỏ bài tùy chọn/miễn nộp; test |
| 5.3 Nộp trễ | ✅ | nhận, nhãn Trễ, không trừ điểm; `cho_nop_tre=false` khóa nộp sau hạn |
| 5.4 Nộp lại | ✅ | ghi đè 1 dòng, `han_nop_lai`; RLS test 5 |
| 5.5 Múi giờ | ✅ | `timestamptz` UTC, hiển thị Asia/Ho_Chi_Minh (`lib/domain/time.ts`); giờ nộp = `now()` server |
| 5.6 Đúng hạn / Trễ / Không nộp bài | ✅ | test các tình huống: đúng hạn, trễ, nộp lại sau trễ, miễn nộp, gia hạn riêng, tùy chọn, hạn nộp lại |
| 5.7 Nộp & chấm cùng lúc | ✅ | `gv_luu_diem` so mốc → hộp "Học sinh vừa nộp bản mới hơn…"; RLS test 7 |
| 5.8 Em chưa làm được | ✅ | `student_flags`, tab Cần hỗ trợ, huy hiệu 🙋, thông báo GV |
| 5.9 Tài khoản HS | ✅ | email ảo, mật khẩu tạm ngẫu nhiên an toàn, đổi 1 lần, quên MK → yêu cầu cho thầy, không khóa đăng nhập |

## Mục 6 — PPCT
| Mục | Trạng thái | Ghi chú |
|---|---|---|
| 6.1 Cấu trúc module–chủ đề–buổi | ✅ | |
| 6.2 Loại buổi chỉnh được | ✅ | Cài đặt → Loại buổi; seed mặc định |
| 6.3 Quy ước tên | ✅ | `lib/domain/naming.ts` ("Buổi 2: …", "Bài tập 7.1: …") |
| 6.4 Nhập từ Excel | 🟡 | Đủ: ghép cột, loại buổi, ranh giới module (tô màu), "10,11"→"10–11", gom chủ đề, hyperlink→link, xem trước cây + cảnh báo. **Chưa chạy với `ppct.xlsx` thật** (chưa nhận file) — chỉ test bằng dữ liệu giả lập trong `tests/ppct.test.ts` |
| 6.5 Áp dụng cho lớp | ✅ | áp dụng, dời lịch, đã dạy, hẹn giờ; "Tất cả lớp / Chỉ lớp này" |

## Mục 7–9 — Tài liệu, bài tập, tính năng
| Mục | Trạng thái | Ghi chú |
|---|---|---|
| 7 Tài liệu & kho học liệu | ✅ | upload/link, phân loại, ẩn/hiện, chuyển buổi, thay file; link ký ngắn hạn |
| 7 "Tải tất cả (.zip)" (ảnh 12) | ❌ | không có trong spec MVP → ẩn |
| 8 Bài tập & nộp bài | ✅ | code (CodeMirror) + file; tự lưu nháp; chống bấm đúp; kiểm tra loại/dung lượng/nội dung thật ở server |
| 9.1 MVP 1–12 | ✅ | |
| 9.2 Tự động hóa | 🟡 | Làm **không cần cron**: quá hạn, danh sách nhắc PH, tóm tắt hôm nay, cờ bỏ 2 bài liên tiếp tính lúc truy vấn; "sắp đến hạn 24h" sinh khi HS mở web (có thể trễ nếu HS không mở). Muốn đúng giờ tuyệt đối → thêm `pg_cron` (chưa làm). Zalo: soạn sẵn → sao chép (đúng spec) |
| 9.3 Giai đoạn sau (Pyodide, chấm tự động, zip bài nộp…) | ❌ | ngoài MVP; có bảng `teacher_notes` (ghi chú riêng GV) đã làm |
| 9.4 Số liệu hiển thị | ✅ | %, hành trình, điểm TB, huy hiệu cố định; test `tests/stats.test.ts` |
| 9.5 Bảng điểm, hệ số, học kỳ | ✅ | TB có hệ số, làm tròn chỉnh được, xuất Excel (exceljs), nhập điểm Excel |

## Mục 12 — Màn hình
| Nhóm | Trạng thái | Ghi chú |
|---|---|---|
| HS: A, B1–B6 + 12.6 (kho, bài tập, kết quả, cài đặt, thông báo, lớp của tôi, hồ sơ, hướng dẫn, quên/đổi MK) | ✅ | theo bộ ảnh, đã sửa chỗ mâu thuẫn spec (bảng trong README) |
| GV: B7–B9 + 12.6 (chương trình, soạn buổi/bài, kho GV, chấm, hàng đợi, tình hình nộp, HS, hồ sơ HS, lớp, thông báo lớp, bảng điểm, phiếu, nhập điểm, cài đặt, thùng rác, nhật ký) | ✅ | màn không có ảnh: tự thiết kế cùng phong cách; SVG duyệt ở `docs/mockups/` |
| 12.7 Responsive | 🟡 | đã viết: menu bật ra, bảng cuộn ngang, Chương trình học dạng thẻ trên điện thoại. **Chưa xem trên máy thật** |

## Mục 14 — Nút theo màn hình
✅ Đã đối chiếu từng dòng bảng 14 bằng tìm chữ trong mã. Đã sửa thêm: nút "Bỏ qua bài này" ở màn chấm.
🟡 "Tải bài nộp zip cả lớp" — thuộc 9.3, chưa làm.

## Mục 15 — Trạng thái & xác nhận
| Mục | Trạng thái | Ghi chú |
|---|---|---|
| 15.1 Tải / rỗng / lỗi / thành công / không quyền / 404 | ✅ | `components/ui/States.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx` |
| 15.2 Hộp xác nhận (10 loại) | ✅ | `components/ui/Modal.tsx` + từng màn |

## An ninh & truy cập (GĐ7)
| Mục | Trạng thái | Ghi chú |
|---|---|---|
| RLS mọi bảng | ✅ | 30/30 bảng; 15 kiểm thử RLS trên Postgres thật (`tests/sql/rls_test.sql`) đạt |
| Khóa service_role | ✅ | chỉ ở `lib/supabase/admin.ts` (`server-only`) và server actions; không có `NEXT_PUBLIC_` |
| Markdown / code HS | ✅ | `react-markdown` không bật HTML thô; code hiển thị dạng văn bản; không chạy code HS |
| Độ tương phản | 🟡 | chữ trắng trên cam `#F97316` (bám mockup) chỉ ~2,8:1, dưới chuẩn WCAG AA 4,5:1 → đổi `--color-cam-500` thành `#c2410c` nếu muốn đạt chuẩn |
| Bàn phím | 🟡 | kéo thả có KeyboardSensor, hộp thoại đóng bằng Esc; chưa thử bằng trình đọc màn hình |
