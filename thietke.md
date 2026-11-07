# THIẾT KẾ & TIẾN ĐỘ — Python LMS (file bàn giao giữa các đoạn chat)

> **Cách dùng ở chat mới (kể cả tài khoản khác):** upload **file này** + **`python-lms.zip`** (mã nguồn mới nhất) + `python-lms-spec-v6.md` + file prompt (`3c80d5d9-attachment.txt`). Thêm nếu cần: bộ ảnh mockup (**nén .zip**, không dùng .rar), `ppct.xlsx`.
> Gõ: *"Đọc thietke.md, giải nén python-lms.zip, làm tiếp từ mục 6 (việc còn lại)"*.
> File này (và bản sao `PROGRESS.md` trong dự án) được cập nhật **sau mỗi bản giao**. Bản mới nhất luôn đúng hơn bản cũ.

**Cập nhật lần cuối:** 06/11/2026 (chat 2) — **Đã viết xong GĐ0–GĐ8. Còn: chạy `npm install` + `build` thật, thử với `ppct.xlsx` thật.**

---

## 1. Tóm tắt dự án
Web LMS dạy Python cho giáo viên Tin học. Next.js 16 (App Router) + TypeScript + Tailwind 4 + Supabase (Postgres/Auth/Storage/RLS, vùng Singapore) → GitHub → Vercel.
Thương hiệu hiện dùng: **TechKids Academy** (theo bộ mockup) — đổi ở `lib/brand.ts`. Hình minh họa: **cắt từ bộ mockup** vào `public/images/`.

Nguyên tắc: **luật nghiệp vụ theo spec, hình thức theo ảnh.** Những chỗ ảnh mâu thuẫn spec đã xử lý: bỏ SĐT phụ huynh, bỏ đổi mật khẩu trong Cài đặt HS, "Điểm tạm tính" → "Đã nộp – chờ thầy chấm", "Lịch sử nộp" → "Đã nộp N lần – bản mới nhất lúc…", "Chưa nộp quá hạn" → "Không nộp bài", "Bài 2" → "Buổi 2", ẩn "Tải tất cả (.zip)".

## 2. Bảng ảnh ↔ màn hình
| # | Ảnh | Màn | Đường dẫn |
|---|---|---|---|
| 0 | `3206685c-…jfif` | Trang chủ HS (A) | `/` |
| 1 | `…1hui6m…png` | Cài đặt HS | `/cai-dat` |
| 2 | `…4kkswi…png` | Chấm bài | `/gv/bai-tap/cham/[id]` |
| 3 | `…7oa66o…png` | Nộp thành công | `/bai-tap/[id]/da-nop` |
| 4 | `…auy4ci…png` | Chi tiết buổi | `/buoi-hoc/[id]` |
| 5 | `…b6aqf6…png` | Đăng nhập | `/dang-nhap` |
| 6 | `…b6h7ln…png` | Tổng quan các lớp | `/gv` |
| 7 | `…hobnbg…png` | Báo cáo & Nhắc PH | `/gv/bao-cao` |
| 8 | `…i2u0f8…png` | Ma trận tiến độ | `/gv/lop/[id]` |
| 9 | `…pkmw8w…png` | Làm bài | `/bai-tap/[id]/lam-bai` |
| 10 | `…rmcij9…png` | Kết quả | `/ket-qua` |
| 11 | `…s8r74w…png` | Danh sách buổi | `/buoi-hoc` |
| 12 | `…utuqg5…png` | Kho học liệu | `/kho-hoc-lieu` |
| 13 | `…xtjeqj…png` | Quản lý HS | `/gv/hoc-sinh` |
| 14 | `…yc6aam…png` | Danh sách bài tập | `/bai-tap` |
Màn không có ảnh: SVG mockup ở `docs/mockups/` (8 màn quan trọng nhất). Bảng đầy đủ tên file trong `README.md`.

**Hệ thống thiết kế:** nền gradient `#E8F1FF→#F7FAFF`; thẻ trắng bo 20px viền `#E3ECFA`; sidebar navy `#14224F→#1B2A5E`, mục chọn cam `#F97316`; nút chính cam pill, phụ xanh `#2563EB`/navy `#1E2B5E`; tiêu đề `#0F1B4C`; font Be Vietnam Pro; editor code nền `#111827`. Biến màu ở `app/globals.css` (`@theme`).

## 3. Giả định đã chốt (mục 17 spec)
PPCT chung + bản riêng theo lớp · Nộp trễ: nhận, nhãn Trễ, không trừ điểm, tùy chọn khóa · Thang 0–10 + "Cần nộp lại" · Loại nộp theo từng bài · Trang chủ đầy đủ trên máy tính, gọn trên điện thoại · File: tài liệu 50 MB, đề 20 MB, bài nộp file 10 MB, code 1 MB (`lib/domain/files.ts`) · Bạn cùng lớp: chỉ họ tên · Làm tròn 1 chữ số, hệ số mặc định 1 · Màu cam bám mockup · Supabase/Vercel gói miễn phí.

## 4. Quyết định kỹ thuật
- **Excel: `exceljs` 4.4.0** (SheetJS trên npm `xlsx@0.18.5` ngừng cập nhật, có lỗ hổng đã công bố). Đọc hyperlink + màu tô nền. Chỉ chạy ở server (`serverExternalPackages`).
- Thứ tự kéo thả: `thu_tu` text fractional index (`lib/domain/order.ts`), tách `nhan_buoi`.
- Trạng thái/nhãn/%/điểm TB: view `v_bai_hoc_sinh` + `lib/domain/*` tính lúc truy vấn, **không cron**. Thông báo "bài mới/sắp đến hạn" sinh bởi `hs_tao_thong_bao_tu_dong` khi HS mở web.
- Bản riêng lớp: `ghi_de_cua` + view `v_buoi_hieu_luc`, `v_bai_tap_hieu_luc`.
- Nộp bài qua hàm SQL `hs_nop_bai` (giờ = `now()` server); chấm qua `gv_luu_diem` (phát hiện bản mới, ghi nhật ký).
- Markdown: `react-markdown` + `remark-gfm`, không HTML thô. Next 16 dùng `proxy.ts` (thay middleware).
- Tài khoản HS: email ảo `ma_hs@HS_EMAIL_DOMAIN`, mật khẩu tạm 8 ký tự (crypto, bỏ ký tự dễ nhầm). GV tạo bằng `npm run create-teacher -- <ten> "<Họ tên>" <mk>`.

## 5. Tiến độ giai đoạn
| GĐ | Nội dung | Trạng thái |
|---|---|---|
| 0 | Đọc tài liệu, bảng ảnh↔màn, giả định | ✅ |
| 1 | Khung dự án, hệ thống thiết kế, layout HS/GV | ✅ |
| 2 | SQL 001–004 + seed, đăng nhập, RLS, tài khoản, đổi MK 1 lần, quên MK | ✅ |
| 3 | Màn học sinh (16 màn) | ✅ |
| 4 | GV: Chương trình học, soạn buổi/bài, tài liệu, nhập/xuất PPCT | ✅ |
| 5 | GV: chấm, hàng đợi, tình hình nộp, ma trận, cần hỗ trợ, báo cáo, bảng điểm, phiếu in, thông báo, nhập điểm | ✅ |
| 6 | Lớp/HS, hồ sơ HS, cài đặt, thùng rác, nhật ký | ✅ |
| 7 | Rà soát an ninh, kiểm thử | ✅ (phần chạy được; xem mục 7) |
| 8 | README triển khai, .env.example, docs, SVG mockup, zip | ✅ |

## 6. Việc còn lại (làm tiếp ở chat sau)
1. **Chạy thật**: `npm install` → `npm run typecheck` → `npm run lint` → `npm test` → `npm run build`; sửa lỗi phát sinh (môi trường chat 1–2 không có mạng npm). Kiểm tra các phiên bản ghim trong `package.json` có tồn tại trên npm.
2. **Thử `ppct.xlsx` thật** ở màn Nhập PPCT (chưa nhận file); chỉnh `lib/domain/ppct.ts` nếu cột/màu khác dự kiến.
3. Xem giao diện trên trình duyệt + điện thoại thật, so với ảnh mockup; chạy `docs/kiem-thu-thu-cong.md`.
4. Logo/tên thương hiệu thật (nếu khác TechKids) → `lib/brand.ts` + `public/images/`.
5. Tùy chọn: `pg_cron` cho thông báo đúng giờ; tải zip bài nộp cả lớp; đổi cam `#c2410c` cho đạt tương phản.

## 7. Kiểm chứng đã chạy (chat 2)
- SQL 001→004 + seed trên **PostgreSQL 16 thật** (giả lập schema `auth`/`storage` của Supabase): chạy sạch; **15/15** kiểm thử RLS (`tests/sql/rls_test.sql`) đạt.
- **53/53** kiểm thử logic (`tests/*.test.ts`) đạt — chạy bằng node:test qua lớp giả lập vitest (chưa cài được vitest thật).
- 155 file TS/TSX: 0 lỗi cú pháp; `tsc` với thư viện giả lập: chỉ 1 lỗi do giả lập (`DragEndEvent`).
- Rà an ninh: không `dangerouslySetInnerHTML`; `service_role` chỉ ở `lib/supabase/admin.ts` (`server-only`) + server actions (`"use server"`); không biến `NEXT_PUBLIC_` bí mật; RLS bật 30/30 bảng; `.env.local` trong `.gitignore`.
- **CHƯA**: `npm install`, `next build`, chạy giao diện, thử Supabase thật.

## 8. Tài liệu trong dự án
`README.md` (13 bước triển khai) · `docs/so-do-du-lieu.md` · `docs/kiem-thu-thu-cong.md` · `docs/doi-chieu-spec.md` (Đã làm/Một phần/Chưa làm) · `docs/mockups/*.svg` · `PROGRESS.md` (= bản sao file này).

## 9. Nhật ký thay đổi file này
- 06/11/2026 chat 1: tạo sau GĐ0; sau đó viết mã GĐ1–GĐ6 (chưa kịp ghi vào file này).
- 06/11/2026 chat 2: chạy lại kiểm thử SQL/RLS/logic; GĐ7 rà soát (sửa nút "Bỏ qua bài này" ở màn chấm); GĐ8: README, docs, 8 SVG mockup, zip; cập nhật toàn bộ file này.
