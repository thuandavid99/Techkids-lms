# Python LMS — Web quản lý học Python

Web cho thầy/cô dạy Python: chương trình học (PPCT), buổi học, tài liệu, bài tập, nộp bài, chấm bài, ma trận tiến độ, nhắc phụ huynh, bảng điểm, phiếu tiến độ.
Công nghệ: **Next.js + TypeScript + Tailwind** (giao diện), **Supabase** (cơ sở dữ liệu, đăng nhập, lưu file), chạy trên **Vercel**.

> ⚠️ **Trạng thái kiểm chứng (đọc trước):** mã được viết trong môi trường **không có mạng để cài thư viện**, nên **chưa chạy `npm install` / `npm run build` lần nào**. Đã kiểm chứng được: SQL 001–004 + seed chạy trên Postgres 16 thật + 15 kiểm thử phân quyền (RLS) đều đạt; 53 kiểm thử logic (`tests/*.test.ts`) đều đạt; 155 file TS/TSX không lỗi cú pháp; kiểm tra kiểu với thư viện giả lập chỉ còn 1 lỗi do giả lập. Lần đầu chạy ở máy thầy/cô, nếu `npm run build` báo lỗi, chép nguyên thông báo lỗi gửi vào chat để sửa. Xem `PROGRESS.md`.

---

## Mục lục
1. [Cài Node.js và VS Code](#1-cài-nodejs-và-vs-code)
2. [Giải nén và chạy thử tại máy](#2-giải-nén-và-chạy-thử-tại-máy)
3. [Tạo dự án Supabase (vùng Singapore)](#3-tạo-dự-án-supabase-vùng-singapore)
4. [Chạy các file SQL theo thứ tự](#4-chạy-các-file-sql-theo-thứ-tự)
5. [Tắt đăng ký công khai, kiểm tra Storage riêng tư](#5-tắt-đăng-ký-công-khai-kiểm-tra-storage-riêng-tư)
6. [Lấy khóa, điền `.env.local`](#6-lấy-khóa-điền-envlocal)
7. [Tạo tài khoản giáo viên](#7-tạo-tài-khoản-giáo-viên)
8. [Đẩy mã lên GitHub (kho riêng tư)](#8-đẩy-mã-lên-github-kho-riêng-tư)
9. [Đưa lên Vercel](#9-đưa-lên-vercel)
10. [Đăng nhập thử trên điện thoại](#10-đăng-nhập-thử-trên-điện-thoại)
11. [Cập nhật sau này](#11-cập-nhật-sau-này)
12. [Sao lưu](#12-sao-lưu)
13. [Lưu ý gói miễn phí](#13-lưu-ý-gói-miễn-phí)
- [Bảng ảnh mockup ↔ màn hình](#bảng-ảnh-mockup--màn-hình) · [Cấu trúc thư mục](#cấu-trúc-thư-mục) · [Đổi tên thương hiệu, hình](#đổi-tên-thương-hiệu-hình) · [Lỗi thường gặp](#lỗi-thường-gặp)

---

## 1. Cài Node.js và VS Code
1. Vào **https://nodejs.org** → bấm nút **LTS** (bản ổn định, cần **20.9 trở lên**, khuyên dùng 22) → tải về → bấm đúp cài, cứ bấm **Next** đến hết.
2. Vào **https://code.visualstudio.com** → **Download** → cài.
3. Kiểm tra: mở **VS Code** → menu **Terminal → New Terminal** (khung đen hiện ở dưới) → gõ:
   ```bash
   node -v
   npm -v
   ```
   Hiện số phiên bản (ví dụ `v22.x.x`) là được.

## 2. Giải nén và chạy thử tại máy
1. Bấm chuột phải `python-lms.zip` → **Extract All / Giải nén** → được thư mục `python-lms`.
2. VS Code → **File → Open Folder…** → chọn thư mục `python-lms`.
3. Terminal (Terminal → New Terminal), gõ lần lượt:
   ```bash
   npm install
   ```
   (chờ 1–3 phút, tải thư viện về thư mục `node_modules`).
4. Làm tiếp bước 3–7 (cần Supabase và `.env.local` mới đăng nhập được), rồi:
   ```bash
   npm run dev
   ```
   Mở trình duyệt vào **http://localhost:3000**.
5. Lệnh kiểm tra (không bắt buộc):
   ```bash
   npm run typecheck   # kiểm tra kiểu
   npm run lint        # kiểm tra cách viết mã
   npm test            # chạy kiểm thử logic
   npm run build       # thử đóng gói như trên Vercel
   ```

## 3. Tạo dự án Supabase (vùng Singapore)
1. Vào **https://supabase.com** → **Start your project** → đăng nhập bằng GitHub (hoặc email).
2. Bấm **New project**:
   - **Name**: `python-lms`
   - **Database Password**: bấm **Generate a password** → **chép cất vào nơi an toàn**.
   - **Region**: chọn **Southeast Asia (Singapore)**.
   - Gói: **Free**.
3. Bấm **Create new project** → chờ khoảng 2 phút.

## 4. Chạy các file SQL theo thứ tự
Thanh bên trái Supabase → biểu tượng **SQL Editor** (hình `>_`) → **+ New query**.
Mở từng file trong thư mục `supabase/` bằng VS Code → **Ctrl+A**, **Ctrl+C** → dán vào ô soạn của Supabase → bấm **Run** (góc dưới phải, hoặc Ctrl+Enter). Làm **đúng thứ tự**:

| Thứ tự | File | Làm gì |
|---|---|---|
| 1 | `supabase/001_schema.sql` | Tạo 30 bảng, ràng buộc, chỉ mục |
| 2 | `supabase/002_rls.sql` | Bật phân quyền (RLS) cho mọi bảng, hàm `is_teacher()` |
| 3 | `supabase/003_storage.sql` | Tạo 3 kho file **riêng tư**: `submissions`, `materials`, `assignment-files` |
| 4 | `supabase/004_views_functions.sql` | View tính trạng thái nộp bài, hàm nộp/chấm, thông báo tự động |
| 5 | `supabase/005_giao_vien_rieng.sql` | **Phân loại tài khoản**: Quản trị / Giáo viên (mỗi GV chỉ thấy lớp mình) |
| 6 | `supabase/006_mo_buoi_nhieu_bai.sql` | **Nút gạt mở buổi** (thầy tự mở / tự mở theo lịch), **bài tập nhiều tab** (Bài 1…N, chấm ✓/✗), hàm giữ web “thức” |
| 7 (tùy chọn) | `supabase/seed.sql` | Loại buổi, phân loại tài liệu, nhận xét mẫu, mẫu tin nhắn mặc định |

> Đã chạy 001–004 từ trước? Chỉ cần chạy thêm **005**. Nếu sau này chạy lại 002 hoặc 004, **luôn chạy lại 005 sau cùng**.

- Mỗi lần **Run** thấy chữ **Success. No rows returned** là đúng.
- Chạy lại một file **không làm mất dữ liệu** (các file viết kiểu "nếu chưa có thì tạo").
- Nếu báo đỏ: chép thông báo gửi vào chat.

## 5. Tắt đăng ký công khai, kiểm tra Storage riêng tư
**Tắt đăng ký** (để người lạ không tự tạo tài khoản):
1. Thanh trái → **Authentication** → **Sign In / Providers** (bản cũ: *Providers*/*Settings*).
2. Tìm **Allow new users to sign up** → **tắt** (gạt sang xám) → **Save**.
3. Mục **Email** (Email provider): để **bật** (học sinh đăng nhập bằng email ảo); **Confirm email**: tắt cũng được (tài khoản tạo sẵn đã xác nhận).

**Kiểm tra Storage:**
1. Thanh trái → **Storage** → thấy 3 bucket `submissions`, `materials`, `assignment-files`.
2. Mỗi bucket **không** có nhãn **Public** (phải là riêng tư). Nếu thấy *Public*: bấm `⋯` cạnh bucket → **Edit bucket** → tắt **Public bucket** → **Save**.

## 6. Lấy khóa, điền `.env.local`
1. Supabase → **Project Settings** (bánh răng, góc dưới trái) → **Data API** (hoặc **API**): chép **Project URL**.
2. **Project Settings → API Keys**: chép
   - khóa **anon** / **publishable** (công khai),
   - khóa **service_role** / **secret** (bấm **Reveal**) — **BÍ MẬT, không đưa ai**.
3. Trong VS Code: chuột phải file `.env.example` → **Copy**, dán, đổi tên thành **`.env.local`**. Điền:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=khóa_anon
   SUPABASE_SERVICE_ROLE_KEY=khóa_service_role
   HS_EMAIL_DOMAIN=hs.techkids-lms.vn
   ```
   - `HS_EMAIL_DOMAIN`: đuôi email ảo của học sinh (`ma_hs@đuôi`). **Chọn một lần, không đổi về sau** (đổi thì học sinh cũ không đăng nhập được). Không cần là tên miền thật vì hệ thống không gửi email.
   - **Không bao giờ** thêm `NEXT_PUBLIC_` vào trước `SUPABASE_SERVICE_ROLE_KEY`.

## 7. Tạo tài khoản quản trị (thầy/cô chủ trung tâm)
Trong Terminal VS Code (đã có `.env.local`, đã `npm install`):
```bash
npm run create-teacher -- thaythuan "Thầy Thuận" MatKhauManh123
```
- Tài khoản đầu tiên tự thành **Quản trị**. Đăng nhập ở trang **`/giao-vien`** bằng `thaythuan` + mật khẩu.
- Nếu đã tạo tài khoản bằng tay trong Supabase (email `truongdavid19999@gmail.com`), file `005` tự nâng tài khoản đó lên Quản trị — đăng nhập bằng **email đầy đủ**.
- Quên mật khẩu quản trị: chạy lại đúng lệnh với mật khẩu mới (vai trò Quản trị được giữ nguyên).
- **Thêm giáo viên khác:** đăng nhập quản trị → menu **Giáo viên** → **+ Thêm giáo viên** (email, họ tên, chọn lớp) → hệ thống hiện **mật khẩu tạm một lần** → gửi cho giáo viên. Không cần vào Supabase nữa.
- Tài khoản **học sinh** tạo trong web: **Học sinh → Thêm một bạn / Nhập Excel** → bảng mật khẩu tạm hiện **một lần** → bấm **Tải bảng mật khẩu** / **Sao chép** ngay.

## 8. Đẩy mã lên GitHub (kho riêng tư)
1. Vào **https://github.com** → đăng nhập → góc trên phải **+** → **New repository**.
2. **Repository name**: `python-lms` → chọn **Private** → **Create repository**.
3. Kiểm tra file `.gitignore` có dòng `.env.local` (đã có sẵn) — **khóa bí mật không lên GitHub**.
4. VS Code → thanh trái biểu tượng **Source Control** (3 chấm nối nhau) → **Initialize Repository** → ô *Message* gõ `Bản đầu tiên` → **Commit** (chọn **Yes** nếu hỏi "stage all") → **Publish Branch** → chọn **Publish to GitHub private repository** → chọn kho `python-lms`.
   Cách bằng lệnh (thay `TEN_CUA_BAN`):
   ```bash
   git init
   git add .
   git commit -m "Bản đầu tiên"
   git branch -M main
   git remote add origin https://github.com/TEN_CUA_BAN/python-lms.git
   git push -u origin main
   ```
5. Mở kho trên GitHub, đảm bảo **không** thấy file `.env.local`.

## 9. Đưa lên Vercel
1. Vào **https://vercel.com** → **Sign Up** → **Continue with GitHub**.
2. **Add New… → Project** → thấy kho `python-lms` → **Import** (nếu không thấy: **Adjust GitHub App Permissions** → cho phép kho này).
3. **Project Name**: tên này thành địa chỉ `<tên>.vercel.app`.
4. Mở **Environment Variables**, thêm **4 biến** (Key / Value giống hệt `.env.local`):
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `HS_EMAIL_DOMAIN`.
5. **Deploy** → chờ 2–3 phút → **Continue to Dashboard** → **Visit**.
6. **Kiểm tra vùng chạy = Singapore** (rất quan trọng cho tốc độ): dự án có file `vercel.json` đặt sẵn vùng `sin1` (Singapore, cùng chỗ với Supabase). Kiểm tra: **Settings → Functions → Function Regions** phải là **Singapore (sin1)**. Nếu để mặc định Washington (Mỹ), mỗi lần bấm sẽ chậm thêm vài giây.
7. Đổi/sửa biến sau này: **Project → Settings → Environment Variables** → sửa → **Deployments** → `⋯` bản mới nhất → **Redeploy**.

## 10. Đăng nhập thử trên điện thoại
1. Máy tính: vào `https://<tên>.vercel.app/giao-vien` → đăng nhập quản trị → **Quản lý lớp → Thêm lớp** → **Học sinh → Thêm một bạn** (vào lớp vừa tạo) → chép mật khẩu tạm.
2. **Chương trình học** → thêm buổi (hoặc **Nhập từ Excel** bằng `ppct.xlsx`) → **Áp dụng cho lớp** → mở buổi cho lớp.
3. Điện thoại: mở cùng địa chỉ → đăng nhập bằng **mã học sinh** + mật khẩu tạm → hệ thống bắt **đổi mật khẩu lần đầu** → vào trang chủ → mở buổi → làm bài → nộp.
4. Máy tính (giáo viên): **Bài tập → Hàng đợi chấm** thấy bài vừa nộp → chấm → điện thoại học sinh có thông báo.
5. Danh sách kiểm tra đầy đủ: `docs/kiem-thu-thu-cong.md`.

## 11. Cập nhật sau này
Sửa mã → chạy thử `npm run dev` → kiểm tra → VS Code **Source Control** → gõ ghi chú → **Commit** → **Sync Changes** (đẩy lên GitHub) → Vercel **tự cập nhật** sau 2–3 phút (xem ở tab **Deployments**).
Nếu bản mới lỗi: Vercel → **Deployments** → bản cũ chạy tốt → `⋯` → **Promote to Production** (quay về bản cũ).
Thay đổi cơ sở dữ liệu: chỉ chạy file SQL mới (đánh số tiếp `006_...sql`) trong SQL Editor; **không** xóa bảng cũ.

## 12. Sao lưu
- **Bảng điểm**: Báo cáo → **Bảng điểm** → chọn lớp + học kỳ → **Tải Excel** (làm cuối mỗi tháng/học kỳ).
- **Danh sách / báo cáo**: Báo cáo → **Xuất Excel**; Chương trình học → **Xuất Excel**.
- **Phiếu tiến độ**: Báo cáo → **Phiếu tiến độ** → **In** → chọn **Lưu dưới dạng PDF**.
- **File bài nộp**: Supabase → **Storage → submissions** → chọn thư mục → **Download**. (Tải `.zip` bài nộp cả lớp ngay trong web: *chưa làm*, thuộc "giai đoạn sau" của spec.)
- **Toàn bộ dữ liệu**: gói miễn phí Supabase không có sao lưu tự động dài hạn — thỉnh thoảng xuất Excel như trên.

## 13. Lưu ý gói miễn phí
> **Hãy tự kiểm tra giới hạn HIỆN HÀNH** trên trang chính thức vì có thể đã thay đổi: https://supabase.com/pricing và https://vercel.com/pricing (mục *Hobby*, *Fair Use*).
- **Supabase Free**: dự án có thể **tự tạm dừng khi lâu không ai dùng** (ví dụ nghỉ hè). Khi đó vào supabase.com → dự án → **Restore / Resume project**. Có giới hạn dung lượng cơ sở dữ liệu, dung lượng lưu file và **cỡ tối đa mỗi file** tải lên.
- Giới hạn file trong web chỉnh ở `lib/domain/files.ts` (mặc định: tài liệu 50 MB, file đề 20 MB, bài nộp file 10 MB, file code 1 MB) — **không được lớn hơn giới hạn của Supabase**.
- **Vercel Hobby**: theo điều khoản là cho **mục đích cá nhân, phi thương mại**. Nếu trung tâm thu học phí và dùng web cho việc kinh doanh, cần xem điều khoản và có thể phải dùng gói **Pro**.

---

## Phân loại tài khoản
| Vai trò | Đăng nhập ở | Thấy / làm được |
|---|---|---|
| **Quản trị** | `/giao-vien` (email hoặc tên đăng nhập) | Mọi lớp; menu **Giáo viên** (thêm, gán lớp, cấp lại mật khẩu, khóa); cài đặt hệ thống; chương trình học chung; kho học liệu; thùng rác |
| **Giáo viên** | `/giao-vien` (email) | Chỉ **lớp được gán**: học sinh, chấm bài, ma trận, báo cáo, thông báo lớp, lịch lớp; chương trình chung chỉ **xem**, sửa được **bản riêng** cho lớp mình |
| **Học sinh** | `/dang-nhap` (mã HS) | Bài học, bài tập, nộp bài, kết quả của mình |

Quyền được chặn ở **cơ sở dữ liệu** (RLS), không chỉ ẩn nút: giáo viên A gõ thẳng đường dẫn của lớp B cũng không xem được.

## Chạy thử code Python (kiểu W3Schools)
- Màn **Làm bài**: viết code bên trái, bấm **▶ Chạy** (hoặc **Ctrl + Enter**) → kết quả hiện bên phải. Bài có `input()`: mở **Dữ liệu vào**, mỗi dòng là một lần nhập.
- Lỗi được rút gọn + **gợi ý tiếng Việt** (thụt lề, cú pháp, sai tên biến…). Chạy quá 10 giây (vòng lặp vô hạn) tự dừng.
- Code chạy **ngay trên máy học sinh** bằng Pyodide (Python trong trình duyệt), **không** chạy trên server, **không** chấm điểm. Lần đầu tải khoảng 10 MB rồi trình duyệt tự lưu.
- Giáo viên: màn **Chấm bài** có mục **▶ Chạy thử bài của em**.
- Đổi phiên bản Pyodide: sửa `PYODIDE_URL` trong `components/student/PythonRunner.tsx`.

## Bảng ảnh mockup ↔ màn hình
| # | Tên file ảnh | Màn hình | Đường dẫn |
|---|---|---|---|
| 0 | `3206685c-0e26-4849-99a4-8b4cc212b28b.jfif` | Trang chủ học sinh (Ảnh A) | `/` |
| 1 | `Gemini_Generated_Image_1hui6m1hui6m1hui.png` | Cài đặt tài khoản HS (bỏ SĐT PH + đổi MK) | `/cai-dat` |
| 2 | `Gemini_Generated_Image_4kkswi4kkswi4kks.png` | Chấm bài | `/gv/bai-tap/cham/[id]` |
| 3 | `Gemini_Generated_Image_7oa66o7oa66o7oa6.png` | Nộp bài thành công ("Đã nộp – chờ thầy chấm") | `/bai-tap/[id]/da-nop` |
| 4 | `Gemini_Generated_Image_auy4ciauy4ciauy4.png` | Chi tiết buổi học | `/buoi-hoc/[id]` |
| 5 | `Gemini_Generated_Image_b6aqf6b6aqf6b6aq.png` | Đăng nhập (+ Quên mật khẩu) | `/dang-nhap` |
| 6 | `Gemini_Generated_Image_b6h7lnb6h7lnb6h7.png` | Tổng quan các lớp | `/gv` |
| 7 | `Gemini_Generated_Image_hobnbghobnbghobn.png` | Báo cáo & Nhắc phụ huynh | `/gv/bao-cao` |
| 8 | `Gemini_Generated_Image_i2u0f8i2u0f8i2u0.png` | Ma trận tiến độ | `/gv/lop/[id]` |
| 9 | `Gemini_Generated_Image_pkmw8wpkmw8wpkmw.png` | Làm bài (Soạn code / Upload) | `/bai-tap/[id]/lam-bai` |
| 10 | `Gemini_Generated_Image_rmcij9rmcij9rmci.png` | Kết quả học tập | `/ket-qua` |
| 11 | `Gemini_Generated_Image_s8r74ws8r74ws8r7.png` | Danh sách buổi học | `/buoi-hoc` |
| 12 | `Gemini_Generated_Image_utuqg5utuqg5utuq.png` | Kho học liệu | `/kho-hoc-lieu` |
| 13 | `Gemini_Generated_Image_xtjeqjxtjeqjxtje.png` | Quản lý học sinh (bỏ cột SĐT PH) | `/gv/hoc-sinh` |
| 14 | `Gemini_Generated_Image_yc6aamyc6aamyc6a.png` | Danh sách bài tập | `/bai-tap` |

Màn **không có ảnh** được thiết kế cùng phong cách; bản vẽ SVG để duyệt nằm ở `docs/mockups/`.

## Cấu trúc thư mục
```
app/(auth)/        đăng nhập, quên mật khẩu, đổi mật khẩu lần đầu
app/(student)/     màn học sinh
app/(teacher)/gv/  màn giáo viên
app/(print)/       trang in phiếu tiến độ
app/api/           tải file (link ký ngắn hạn), đọc/xuất Excel — chạy ở server
components/ui      thành phần dùng chung: Nút, Thẻ, Pill, Hộp thoại, Toast, Trạng thái rỗng…
components/…       thành phần theo vai trò (student / teacher / layout / auth)
lib/domain/        luật nghiệp vụ thuần (trạng thái nộp, %, điểm TB, PPCT…) — có kiểm thử
lib/supabase/      kết nối Supabase (admin.ts CHỈ chạy ở server)
lib/actions/       server actions (ghi dữ liệu)
lib/server/        đọc dữ liệu ở server
lib/brand.ts       TÊN THƯƠNG HIỆU, khẩu hiệu, đường dẫn hình — đổi ở một chỗ
supabase/          001–004 + seed.sql
scripts/           create-teacher.mjs
tests/             kiểm thử logic (vitest) + tests/sql/rls_test.sql
docs/              sơ đồ dữ liệu, kiểm thử thủ công, đối chiếu spec, mockup SVG
```

## Đổi tên thương hiệu, hình
- Tên, khẩu hiệu: sửa `lib/brand.ts`.
- Hình: thay file cùng tên trong `public/images/` (hiện là hình cắt từ bộ mockup). Logo: `logo-circle.png`, `logo-robot.png`; biểu tượng tab trình duyệt: `public/favicon.png`.
- Màu: `app/globals.css` (khối `@theme` ở đầu file). Muốn nút/chữ cam đậm hơn cho dễ đọc: đổi `--color-cam-500` thành `#c2410c`.

## Lỗi thường gặp
| Hiện tượng | Cách xử lý |
|---|---|
| "Thiếu biến môi trường…" | Kiểm tra `.env.local` (máy) hoặc Environment Variables (Vercel) đủ 4 biến, rồi chạy lại / Redeploy |
| Đăng nhập báo sai dù đúng | `HS_EMAIL_DOMAIN` khác lúc tạo tài khoản → đặt lại đúng giá trị cũ; hoặc thầy reset mật khẩu cho em |
| Web chậm/không vào được sau kỳ nghỉ | Supabase tạm dừng dự án → vào Supabase bấm **Restore** |
| Tải file lên báo lỗi dung lượng | File vượt giới hạn trong `lib/domain/files.ts` hoặc của gói Supabase |
| Học sinh không thấy buổi | Buổi chưa **mở** cho lớp đó (Chương trình học → buổi → Cài đặt theo lớp) |
| Giáo viên đăng nhập xong không thấy lớp nào | Quản trị chưa gán lớp: menu **Giáo viên** → **Gán lớp** |
| Giáo viên báo "Chỉ quản trị sửa được nội dung chung" | Đúng thiết kế: chọn **"Chỉ lớp …"** để sửa bản riêng cho lớp mình |
| Bấm chuyển trang chậm | Chạy `npm run dev` luôn chậm hơn (mỗi trang được dựng lần đầu). Bản trên Vercel nhanh hơn nhiều — nhớ kiểm tra vùng **Singapore** (bước 9.6) |
| Bấm Chạy báo "Không tải được bộ chạy Python" | Mạng chặn `cdn.jsdelivr.net` (một số mạng trường học). Thử mạng khác |
