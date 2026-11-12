# THIẾT KẾ & TIẾN ĐỘ — Python LMS (file bàn giao giữa các đoạn chat / tài khoản)

> ## Cách dùng ở chat mới (kể cả tài khoản Claude khác)
> 1. Upload: **file này** + **`python-lms.zip`** (mã mới nhất — nếu đã sửa trên máy thì nén lại thư mục `D:\python-lms`, **bỏ** `node_modules`, `.next`, `.env.local`) + `python-lms-spec-v6.md` + file prompt (`3c80d5d9-attachment.txt`). Nếu cần so giao diện: bộ ảnh mockup **nén .zip** (không dùng .rar). Nếu làm phần nhập PPCT: `ppct.xlsx`.
> 2. Gõ: **"Đọc thietke.md, giải nén python-lms.zip, làm tiếp mục 8 (việc tiếp theo), bắt đầu từ 8.1"**.
> 3. Cuối mỗi lần làm, yêu cầu Claude **cập nhật lại file này** (và `PROGRESS.md` trong dự án = bản sao) rồi gửi file + zip mới.
>
> **Quy ước trả lời:** tiếng Việt, ngắn gọn, hướng dẫn từng bước bấm nút ở đâu (người dùng là giáo viên Tin học, không phải lập trình viên chuyên nghiệp). Không tự ý chạy `npm audit fix --force`.

**Cập nhật lần cuối:** 12/11/2026 (chat 4 — sửa chữ tràn; mở buổi bằng nút gạt; bài tập nhiều tab; nhập PPCT thật; làm lại hình; tối ưu gói miễn phí).
**Tình trạng:** Mã GĐ0–GĐ9 đã viết xong. **GĐ9 (chat 3) xong:** phân loại tài khoản Quản trị/Giáo viên + giao diện giáo viên riêng, tăng tốc chuyển trang, **chạy code Python ngay trên trình duyệt kiểu W3Schools**. Thầy cần: chạy `005_giao_vien_rieng.sql`, nâng gói (6.1), `npm run build`, đẩy GitHub/Vercel (vùng Singapore).

---

## 1. Thông tin chung
| Mục | Giá trị |
|---|---|
| Chủ dự án | **Trương Công Thuận** — `truongdavid19999@gmail.com` (giáo viên, quản trị) |
| Thư mục trên máy | `D:\python-lms` (Windows, VS Code, Node cài ở `D:\`, npm 12) |
| Thương hiệu đang dùng | **TechKids Academy** (theo bộ mockup) — đổi ở `lib/brand.ts`; hình ở `public/images/` (cắt từ mockup) |
| Công nghệ | Next.js 16 (App Router, `proxy.ts` thay middleware) + TypeScript + Tailwind 4 + Supabase (Postgres/Auth/Storage/RLS, vùng **Singapore**) → GitHub (kho riêng tư) → Vercel |
| Tài liệu chuẩn | `python-lms-spec-v6.md` = luật nghiệp vụ; bộ 15 ảnh mockup = hình thức. Mâu thuẫn: **nghiệp vụ theo spec, hình thức theo ảnh** |

## 2. Biến môi trường (`.env.local` ở máy + Environment Variables trên Vercel)
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...      # khóa anon (Legacy) hoặc sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=...          # khóa service_role (Legacy) hoặc sb_secret_... — BÍ MẬT
HS_EMAIL_DOMAIN=hs.techkids-lms.vn     # KHÔNG đổi sau khi đã tạo học sinh
```
- Mã nhận cả tên `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` thay cho `..._ANON_KEY` (đã sửa ở chat 2: `lib/supabase/env.ts`, `browser.ts`, `proxy.ts`).
- Lấy khóa: Supabase → Project Settings → **Data API** (Project URL) và **API Keys** (tab *Legacy API keys*: anon + service_role/Reveal; hoặc tab *Publishable and secret API keys*).

## 3. Bảng ảnh ↔ màn hình (đã xử lý chỗ ảnh mâu thuẫn spec)
| # | Ảnh | Màn | Đường dẫn | Điều chỉnh so với ảnh |
|---|---|---|---|---|
| 0 | `3206685c-…jfif` | Trang chủ HS (A) | `/` | — |
| 1 | `…1hui6m…png` | Cài đặt HS | `/cai-dat` | bỏ SĐT phụ huynh + bỏ đổi mật khẩu |
| 2 | `…4kkswi…png` | Chấm bài | `/gv/bai-tap/cham/[id]` | thêm giờ nộp đầu/mới nhất, nhận xét mẫu, Mở cho nộp lại, Bỏ qua bài này |
| 3 | `…7oa66o…png` | Nộp thành công | `/bai-tap/[id]/da-nop` | "Điểm tạm tính" → "Đã nộp – chờ thầy chấm" |
| 4 | `…auy4ci…png` | Chi tiết buổi | `/buoi-hoc/[id]` | "Bài 2" → "Buổi 2"; thêm "Em chưa làm được" |
| 5 | `…b6aqf6…png` | Đăng nhập | `/dang-nhap` | thêm "Quên mật khẩu?" |
| 6 | `…b6h7ln…png` | Tổng quan các lớp | `/gv` | thêm Tóm tắt hôm nay |
| 7 | `…hobnbg…png` | Báo cáo & Nhắc PH | `/gv/bao-cao` | "Chưa nộp quá hạn" → "Không nộp bài" |
| 8 | `…i2u0f8…png` | Ma trận tiến độ | `/gv/lop/[id]` | thêm chú giải ! đỏ, nhóm module, menu ⋯, 🙋 |
| 9 | `…pkmw8w…png` | Làm bài | `/bai-tap/[id]/lam-bai` | "Lịch sử nộp" → "Đã nộp N lần – bản mới nhất lúc…" |
| 10 | `…rmcij9…png` | Kết quả | `/ket-qua` | biểu đồ theo module |
| 11 | `…s8r74w…png` | Danh sách buổi | `/buoi-hoc` | nhóm module, lọc, tìm |
| 12 | `…utuqg5…png` | Kho học liệu | `/kho-hoc-lieu` | ẩn "Tải tất cả (.zip)" |
| 13 | `…xtjeqj…png` | Quản lý HS | `/gv/hoc-sinh` | bỏ cột SĐT PH |
| 14 | `…yc6aam…png` | Bài tập | `/bai-tap` | tên "Bài tập 7.1: …" |

Màn không có ảnh → SVG mockup ở `docs/mockups/` (8 màn; tạo lại bằng `docs/mockups/_tao_mockup.py`).
**Hệ thống thiết kế:** nền gradient `#E8F1FF→#F7FAFF`; thẻ trắng bo 20px viền `#E3ECFA`; sidebar navy `#14224F→#1B2A5E`, mục chọn cam `#F97316`; nút chính cam pill; phụ xanh `#2563EB` / navy `#1E2B5E`; tiêu đề `#0F1B4C`; font Be Vietnam Pro; editor code `#111827`. Biến màu: `app/globals.css` (`@theme`).

## 4. Giả định & quyết định đã chốt
- PPCT chung + bản riêng theo lớp (`ghi_de_cua`, view `v_buoi_hieu_luc`, `v_bai_tap_hieu_luc`). Hỏi "Tất cả lớp / Chỉ lớp này".
- Nộp trễ: nhận, nhãn Trễ, không trừ điểm; tùy chọn khóa. Thang 0–10 + "Cần nộp lại" (`han_nop_lai`).
- File: tài liệu 50 MB, đề 20 MB, bài nộp file 10 MB, code 1 MB (`lib/domain/files.ts`). Làm tròn 1 chữ số; hệ số mặc định 1.
- **Excel: `exceljs` 4.4.0** (không dùng SheetJS npm `xlsx@0.18.5` vì ngừng cập nhật + lỗ hổng). Chạy ở server.
- Thứ tự kéo thả: `thu_tu` text fractional index (`lib/domain/order.ts`), tách `nhan_buoi`.
- Trạng thái/nhãn/%/điểm TB: tính lúc truy vấn (view `v_bai_hoc_sinh` + `lib/domain/*`), **không cron**. Thông báo "bài mới / sắp đến hạn 24h" sinh bởi `hs_tao_thong_bao_tu_dong` khi HS mở web.
- Nộp bài: hàm SQL `hs_nop_bai` (giờ = server). Chấm: `gv_luu_diem` (phát hiện bản mới, ghi `audit_log`).
- Markdown: `react-markdown` + `remark-gfm`, không HTML thô.
- HS: email ảo `ma_hs@HS_EMAIL_DOMAIN`, mật khẩu tạm 8 ký tự (crypto), đổi 1 lần; quên MK → yêu cầu cho thầy.
- **Tài khoản (từ chat 3):** vai trò `quan_tri` (toàn quyền) / `giao_vien` (chỉ lớp trong `class_teachers`) / `hoc_sinh`. Quản trị đầu tiên: `npm run create-teacher` (tài khoản đầu tự thành quản trị) hoặc tạo tay trên Supabase rồi chạy 005 (tự nâng `truongdavid19999@gmail.com`). Giáo viên khác: quản trị thêm trong web (menu **Giáo viên**), đăng nhập ở **`/giao-vien`** bằng email, bị bắt đổi mật khẩu lần đầu (≥ 8 ký tự).
- **Chạy thử code:** Pyodide v0.28.0 từ jsDelivr, trong Web Worker (`public/py-worker.js`), giới hạn 10 giây, ô "Dữ liệu vào" cho `input()`, gợi ý lỗi tiếng Việt (`lib/domain/python-loi.ts`). Không chạy code trên server, không chấm tự động.
- **Tốc độ:** `getClaims()` thay `getUser()` (proxy + `getProfile`), `vercel.json` vùng `sin1`, `loading.tsx` cho các mục con, thanh tiến trình `NavProgress`.

## 5. Tiến độ
| GĐ | Nội dung | Trạng thái |
|---|---|---|
| 0–8 | Tài liệu, khung, SQL+RLS, màn HS, màn GV, quản lý, rà soát, README/docs/zip | ✅ đã viết mã |
| — | `npm install` trên máy thầy | ✅ chạy được (06/11) |
| — | Vá Next.js lên bản mới nhất dòng 16 + `npm run build` lần đầu | ⏳ thầy đang làm (mục 6.1) |
| — | GitHub + Vercel | ⏳ chưa |
| — | Thử `ppct.xlsx` thật | ⏳ chưa có file |
| 9 | Giao diện giáo viên riêng + phân quyền theo lớp + chạy code trình duyệt + tăng tốc | ✅ chat 3 (mục 7) |

**Đã kiểm chứng (chat 3):** SQL 001→005 + seed trên PostgreSQL 16 thật, **23/23** kiểm thử RLS đạt (15 cũ + 8 mới cho GV theo lớp), chạy lại 005 hai lần không lỗi; **57/57** kiểm thử logic đạt; 166 file TS/TSX 0 lỗi cú pháp; `tsc` với thư viện giả lập chỉ còn 1 lỗi do giả lập. **Chưa:** `next build`, chạy giao diện thật, Supabase thật, bộ chạy Pyodide trên trình duyệt thật (máy dựng không tải được CDN).

## 6. VIỆC THẦY CẦN LÀM (trên máy, theo thứ tự)
### 6.1 Vá lỗ hổng + nâng gói + build thử (bắt buộc trước khi lên Vercel)
```bash
npm install --save-exact next@16 eslint-config-next@16 react@19 react-dom@19
npm install --save-exact @supabase/supabase-js@2 @supabase/ssr@latest
npm install-scripts approve sharp esbuild
npm run build
```
(Gói Supabase mới để chắc chắn có `getClaims()` — dùng cho tốc độ.) Sau đó chạy **`supabase/005_giao_vien_rieng.sql`** trong SQL Editor.
Lý do: bản ghim ban đầu `next@16.0.10` có lỗ hổng nghiêm trọng công bố trong 2026 (các bản vá 16.2.11, 16.3.3, 16.3.6…). Có lỗi đỏ → chép gửi Claude. Còn cảnh báo vừa/thấp từ `exceljs` (chỉ chạy server) — chấp nhận tạm.
PowerShell báo "running scripts is disabled" → đổi Terminal sang **Command Prompt** hoặc `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.

### 6.2 Chạy thử tại máy
`npm run dev` → `http://localhost:3000/dang-nhap`. Điện thoại cùng Wi-Fi: `npm run dev -- -H 0.0.0.0` → `http://<IPv4 từ ipconfig>:3000`.

### 6.3 Tạo / thêm giáo viên
**Cách chính (sau khi chạy 005):** đăng nhập quản trị ở `/giao-vien` → menu **Giáo viên** → **+ Thêm giáo viên** → gửi mật khẩu tạm cho GV.
**Cách dự phòng bằng SQL** (nếu web lỗi): Supabase → Authentication → Users → Add user (Auto Confirm) rồi chạy (sửa email + họ tên; muốn quản trị thì đổi `'giao_vien'` thành `'quan_tri'`):
```sql
insert into public.profiles (id, ma_hs, email, ho_ten, vai_tro, must_change_password, dang_hoc)
select id, email, email, 'Họ Tên', 'giao_vien', false, true
from auth.users where email = 'email@gmail.com'
on conflict (id) do update set vai_tro = excluded.vai_tro, ho_ten = excluded.ho_ten, email = excluded.email,
  must_change_password = false, deleted_at = null;
-- Gán lớp: thay '6A1' bằng tên lớp
insert into public.class_teachers (class_id, teacher_id)
select c.id, u.id from public.classes c, auth.users u
where u.email = 'email@gmail.com' and c.ten_lop = '6A1' on conflict do nothing;
```
Thu hồi quyền: dùng nút **Khóa** ở menu Giáo viên (hoặc SQL `update public.profiles set deleted_at = now() where id = (select id from auth.users where email = '...');`).

### 6.4 GitHub → Vercel
Cài Git (git-scm.com) → `git config --global user.name/user.email` → VS Code **Source Control → Publish to GitHub → private** → kiểm tra **không có `.env.local`** trên GitHub → vercel.com **Add New → Project → Import** → nhập **4 biến** mục 2 → **Deploy** → **Settings → Functions → Function Regions = Singapore (sin1)** (file `vercel.json` đã đặt sẵn; mặc định Washington sẽ rất chậm). Cập nhật sau: Commit → Sync Changes (Vercel tự build). Lỗi: Vercel → Deployments → Build Logs → chép gửi Claude.

### 6.5 Sau khi chạy được
Chạy danh sách `docs/kiem-thu-thu-cong.md`; gửi `ppct.xlsx` để thử nhập PPCT; quyết định logo/tên thật.

---

## 7. GĐ9 — GIAO DIỆN GIÁO VIÊN RIÊNG, CHẠY CODE, TỐC ĐỘ (✅ đã làm ở chat 3)

### 7.1 Vai trò (đã cài)
| Vai trò | Đăng nhập | Quyền |
|---|---|---|
| `quan_tri` | `/giao-vien` | Toàn quyền; menu **Giáo viên**; cài đặt hệ thống; chương trình chung; nhập PPCT; kho học liệu; thùng rác; tạo/xóa/lưu trữ lớp; gán GV |
| `giao_vien` | `/giao-vien` | Chỉ lớp trong `class_teachers`: HS (thêm, sửa, reset MK, chuyển giữa lớp mình), chấm, ma trận, báo cáo, thông báo lớp, lịch/mở buổi, áp dụng chương trình cho lớp mình, **bản riêng** buổi/bài cho lớp mình; xem chương trình chung + kho học liệu; Cài đặt chỉ có đổi mật khẩu |
| `tro_giang` | — | Như `giao_vien` (dự phòng, chưa có giao diện tạo) |
| `hoc_sinh` | `/dang-nhap` | Không đổi |

Câu hỏi 7.6 cũ → đã dùng mặc định: GV **không** sửa PPCT chung; GV **không** thấy HS lớp khác; trợ giảng làm sau; không cần tên miền riêng (chỉ trang `/giao-vien`).

### 7.2 Đã làm
- **SQL `005_giao_vien_rieng.sql`:** thêm `quan_tri` + cột `profiles.email`; hàm `is_admin()`, `teaches_class()`, `teaches_student()`, `can_edit_lesson()`, `can_edit_assignment()`, `lop_cua_toi()`, `gv_nhan_tb()`; viết lại toàn bộ chính sách (`qt_all` cho quản trị, `gv_doc/gv_them/gv_sua/gv_xoa` theo lớp); Storage chỉ quản trị thao tác trực tiếp; thông báo "Em chưa làm được"/"quên MK" chỉ tới GV lớp đó + quản trị; làm sạch thùng rác chỉ quản trị. Test 14–21 trong `tests/sql/rls_test.sql`.
- **Server actions:** `chayQt()` (chỉ quản trị), `kiemTraLop()` / `kiemTraHs()` bắt buộc trước mọi chỗ dùng khóa `service_role`; chương trình chung/kho học liệu/cài đặt/lớp/thùng rác → quản trị; `luuBuoi`/`luuBaiTap` của GV chỉ cho bản riêng lớp mình (hoặc buổi riêng lớp mình); lỗi RLS 42501 → thông báo tiếng Việt. File mới `lib/actions/gv/giaovien.ts` (thêm/sửa/gán lớp/cấp lại MK/khóa — có chặn tự khóa & giữ ít nhất 1 quản trị).
- **Giao diện:** `/giao-vien` (nền navy, nhãn "Khu vực giáo viên", ô Email); `/gv/giao-vien` (`components/teacher/QuanLyGiaoVien.tsx`); sidebar có nhãn vai trò + menu theo vai trò; tên + vai trò ở menu người dùng; Chương trình học chế độ xem cho GV; BuoiForm/BaiTapForm ẩn "Tất cả lớp" với GV; trang Lớp "Lớp của tôi"; Cài đặt cá nhân; đổi MK lần đầu cho GV (≥ 8 ký tự); đăng xuất GV về `/giao-vien`; HS đăng nhập nhầm cửa GV bị từ chối.
- **Chạy code kiểu W3Schools:** `public/py-worker.js` + `components/student/PythonRunner.tsx` (▶ Chạy / ■ Dừng, Ctrl+Enter, Dữ liệu vào, 10 giây, cắt kết quả 200 KB, lỗi rút gọn + gợi ý); màn Làm bài 2 cột code | kết quả (điện thoại xếp dọc); màn Chấm bài có "▶ Chạy thử bài của em". Test `tests/python-loi.test.ts`.
- **Tốc độ:** `getClaims()`; `vercel.json` `sin1`; `loading.tsx` ở `bai-tap`, `chuong-trinh`, `lop/[id]`; `components/layout/NavProgress.tsx`; `ghiNhatKy` dùng hồ sơ đã có (bớt 1 lần gọi mạng).
- **SVG mockup mới:** `gv-dang-nhap.svg`, `qt-giao-vien.svg`, `hs-lam-bai-chay-thu.svg`.

### 7.3 Còn hạn chế / làm sau
- Chưa kiểm chứng trên trình duyệt thật: Pyodide v0.28.0 (URL ở `PythonRunner.tsx`), luồng `/giao-vien`, màn Giáo viên.
- GV chưa tự thêm tài liệu (kho học liệu do quản trị); chưa có giao diện tạo trợ giảng; nhận xét mẫu dùng chung (chưa có của riêng từng GV).
- Thông báo "sắp đến hạn" vẫn sinh khi HS mở web (chưa `pg_cron`).
- Chạy thử chưa hỗ trợ `input()` kiểu hỏi-đáp từng bước (dùng ô Dữ liệu vào như các trang luyện thi); chưa chấm tự động bằng test case.

## 7b. Chat 4 — SỬA CHỮ TRÀN (✅ 12/11)
Kiểm tra tự động 47 trang × 5 cỡ màn (360, 390, 768, 1024, 1440 px) bằng dữ liệu “khó” (tên HS dài, tên lớp dài, tên file/URL không dấu cách). Trước: 94 lượt trang bị cuộn ngang, 225 phần tử tràn. Sau: **0 / 0**.
- Quy tắc chung (`app/globals.css`): `body` tự ngắt từ quá dài; `.input` không rộng quá khung (ô chọn chữ dài tự “…”); `.h-page` nhỏ hơn trên điện thoại (1.5rem); lớp mới **`.hang-chu`** (khối chữ trong hàng “chữ + nút”: tối thiểu 14rem, hết chỗ thì nút xuống dòng) và **`.chu-dai`** (tên file/link ngắt ở bất kỳ đâu).
- Bố cục 2 cột (`PageGrid`, `LamBai`, `States`, chấm bài, chi tiết buổi, xem thử): thêm `grid-cols-1` + `min-w-0` — trước đây 1 tên file dài làm cả trang rộng ra.
- Thanh trên cùng (`Topbar` + 2 layout): ô chọn lớp/tên lớp tự rút gọn, chuông + ảnh đại diện không bị đẩy ra ngoài; ẩn mũi tên nhỏ trên điện thoại; menu người dùng hiện họ tên đầy đủ.
- Hàng danh sách dùng `.hang-chu`: Bài tập (HS), Tài liệu (HS + kho GV), Hàng đợi chấm; thông báo/ghi chú/thông báo lớp dùng `.chu-dai`.
- Tiêu đề buổi có icon: icon nhỏ (44px) trên điện thoại. 4 ô nhanh ở trang chủ HS gọn hơn trên điện thoại. Bộ lọc ở Ma trận/Tình hình nộp co theo màn hình. Tên buổi ở bảng Chương trình hiện 2 dòng thay vì cắt “…”. Gợi ý “Ctrl + Enter” ẩn trên điện thoại.
- Chưa kiểm được trên font thật Be Vietnam Pro (máy dựng dùng Inter, hơi hẹp hơn) — thầy xem lại trên điện thoại thật.

## 7c. Chat 4 (tiếp) — 6 việc thầy duyệt (✅ 12/11) — **cần chạy `supabase/006_mo_buoi_nhieu_bai.sql`**
1. **Mở buổi bằng nút gạt:** (sau góp ý 12/11: gộp vào **thẻ từng lớp** ở Tổng quan — `MoBuoiLop`; ⚙ chứa Cách mở / Mở-khóa buổi khác / Khóa các buổi chưa dạy; không có lịch hôm nay thì hiện *buổi đang học* + *buổi chưa mở đầu tiên*) (`components/teacher/MoBuoiHomNay.tsx`, chọn buổi bằng `lib/domain/mo-buoi.ts`): mỗi lớp có công tắc *Buổi hôm nay / Buổi sẽ dạy tới* + *Buổi tiếp theo*, chọn "Cách mở": **Thầy tự gạt mở** (mặc định) / **Tự mở theo lịch học** (cột `classes.che_do_mo`, hàm `mo_buoi_theo_lich` chạy khi HS/GV mở web). Nút "Khóa các buổi chưa dạy" (dùng 1 lần cho lớp cũ). `class_lessons.hien_thi` mặc định = false (buổi mới gắn vào lớp sẽ khóa). HS thấy 1–2 buổi sắp tới **mờ có 🔒** (hàm `hs_buoi_sap_mo`, chỉ lộ tên + ngày) ở Trang chủ và Danh sách buổi (`components/student/BuoiSapMo.tsx`).
2. **Bài tập nhiều tab:** cột `assignments.so_bai` (1–50; ô "Số bài nhỏ trong phiếu" ở Soạn bài tập). HS làm trong tab Bài 1…N, mỗi tab ▶ Chạy riêng, nộp 1 lần, web ghi "đã làm x/N". Nội dung lưu trong `code_text` dạng JSON `{"lms":1,"tabs":[…],"link":…}` (bài 1 tab vẫn là code thuần — tương thích dữ liệu cũ) — đọc/ghi qua `lib/domain/bai-nop.ts`. Thầy chấm ✓/✗ từng tab (`components/shared/XemBaiNop.tsx` + `ChamTabsProvider`), GradeForm gợi ý điểm = số đúng/tổng × điểm tối đa ("Dùng điểm này"), lưu `submissions.cham_tabs`; HS xem lại tab nào đúng/sai. File tải về nối các tab có tiêu đề "# ===== Bài i =====".
3. **Nhập PPCT thật** (`lib/domain/ppct.ts`): đoán cột theo DỮ LIỆU (cột "Tài liệu lý thuyết" của thầy thực ra là cột Loại buổi), số buổi kiểu Excel (12.0 → 12; 10.11 → 10–11), bỏ "1. " đầu tên bài, "Casestudy" ≈ "Case study", màu nền **hiếm** (cam đậm) = ranh giới module (cam nhạt tô cả bảng bị bỏ qua), tùy chọn **đánh số lại buổi theo thứ tự dòng** (file thầy có buổi trùng/lệch: 35,37,38,39,36 / 37–39 lặp / 40 ở cuối → thành 1…47). Link theo cột: Quizzi → **nút tím "Làm Quiz"** trong buổi (`laLinkQuiz`), Bài tập → phiếu (phân loại "Phiếu học tập") + **tự tạo bài tập nộp code N tab** (mặc định 10, đề bài = link phiếu), Tham khảo → "Tham khảo". Excel đọc thêm màu từng ô (`lib/server/excel.ts` → `mau`). Thử trên file thật: 44 dòng → 4 module, 47 buổi, đúng như dự kiến.
4. **Hình ảnh:** 13 hình robot tách nền trong suốt, xóa đường kẻ/mảnh thừa (dấu "!" ở banner), làm mờ mép bị cắt, nén **WebP** (3,8 MB → ~0,4 MB); logo tròn ở menu; trường học vẽ lại `public/images/school.svg`; "robot cầm bảng" (bảng bị mất) → dùng robot cầm bảng kẹp. Script: tách nền bằng flood-fill từ mép (OpenCV) — không có trong repo. Trang đăng nhập: nút viền **"Đăng nhập Giáo viên"** / **"Đăng nhập Học sinh"** thay dòng chữ nhỏ.
5. **Nộp bài:** chỉ code (soạn / file .py đọc thành chữ, nạp vào tab đang mở) / **Dán link** (Google Docs/Drive…) / Word-PDF ≤ 2 MB cho bài "nộp file"; **bỏ nộp ảnh** (`lib/domain/files.ts`).
6. **Tối ưu gói miễn phí:** việc "tạo thông báo tự động" chỉ chạy 15 phút/lần (cookie `lms_tb` do `proxy.ts` đặt); `/api/song` + `.github/workflows/giu-web-thuc.yml` gọi DB mỗi ngày để Supabase không tạm dừng (cần biến `SITE_URL` trong GitHub); Cài đặt (quản trị) → **Tải file sao lưu (.xlsx)** (`/api/gv/xuat?loai=sao-luu`: HS + bài nộp kèm code + điểm + nhận xét).
**Đã kiểm:** SQL 001→006 (+ chạy lại 005/006) trên PostgreSQL 16: **26/26** kiểm thử RLS (thêm 22–24); **75/75** kiểm thử logic (thêm `mo-buoi`, `bai-nop`, PPCT thật); hiển thị 47 trang × 5 cỡ màn: 0 trang cuộn ngang. **12/11: `npm run build` trên máy thầy THÀNH CÔNG** (Next 16.4.5, 0 lỗi TypeScript, 39 trang). Chưa: chạy với Supabase thật.

## 8. VIỆC TIẾP THEO CHO CLAUDE (thứ tự ưu tiên)
0. **8.0** Thầy chạy `006_mo_buoi_nhieu_bai.sql`, chép mã mới, `npm run build`; nhập lại PPCT bằng file thật (bật "Đánh số lại"), đặt biến `SITE_URL` cho GitHub Actions. Nhận lỗi build (nếu có) → sửa.
1. **8.1** Nhận kết quả `npm run build` từ thầy → sửa lỗi build/type/lint cho sạch (lần build thật đầu tiên). Kiểm tra `npm test` (vitest thật).
2. **8.2** Hỗ trợ chạy 005, đẩy GitHub/Vercel (vùng sin1); xử lý lỗi Build Logs.
3. **8.3** Thử thật: `/giao-vien`, menu Giáo viên, nút ▶ Chạy (nếu Pyodide v0.28.0 lỗi tải → đổi `PYODIDE_URL`). Theo `docs/kiem-thu-thu-cong.md` mục H, I, J.
4. **8.4** Thử `ppct.xlsx` thật; chỉnh `lib/domain/ppct.ts`.
5. **8.5** Tùy chọn: chấm tự động bằng test case (chạy trong trình duyệt hoặc nối máy chấm DMOJ/TeCHKID), trợ giảng, nhận xét mẫu riêng từng GV, GV tự thêm tài liệu cho lớp mình, `pg_cron`, tải zip bài nộp, logo/tên thật.

## 9. Bản đồ mã nguồn
```
app/(auth)/        dang-nhap (HS), giao-vien (cửa GV/quản trị), quen-mat-khau, doi-mat-khau-lan-dau
app/(student)/     16 màn học sinh
app/(teacher)/gv/  màn giáo viên (lop/[id], bai-tap, hoc-sinh, bao-cao, chuong-trinh, cai-dat, giao-vien [quản trị]…)
app/(print)/phieu  phiếu tiến độ in
app/api/           tai-ve (link ký), gv/excel/doc, gv/xuat
components/ui      Card, Button, Pill, Modal, Toast, States, Markdown, CodeView…
lib/domain/        status, stats, ppct, order, naming, time, files, password, bang-diem, python-loi (có test)
public/py-worker.js  bộ chạy Python trong trình duyệt (Pyodide, Web Worker)
components/student/PythonRunner.tsx  khung ▶ Chạy / kết quả (kiểu W3Schools)
vercel.json        vùng chạy Singapore (sin1)
lib/supabase/      server, browser, admin (server-only), env
lib/actions/       server actions HS + gv/*
lib/server/        đọc dữ liệu ở server
supabase/          001_schema, 002_rls, 003_storage, 004_views_functions, 005_giao_vien_rieng, seed
tests/             *.test.ts + sql/rls_test.sql
docs/              so-do-du-lieu, kiem-thu-thu-cong, doi-chieu-spec, mockups/
```

## 10. Nhật ký thay đổi file này
- 06/11 chat 1: tạo sau GĐ0; viết mã GĐ1–GĐ6.
- 06/11 chat 2: kiểm thử lại SQL/RLS/logic; GĐ7–8 (README, docs, 8 SVG, zip); sửa "Bỏ qua bài này"; nhận cả tên biến PUBLISHABLE_KEY; hướng dẫn chạy local, tạo GV trên Supabase, vá Next.js, GitHub/Vercel; **thêm đặc tả GĐ9 giao diện giáo viên riêng**.
- 07/11 chat 3: GĐ9 — phân loại tài khoản Quản trị/Giáo viên (SQL 005 + 8 test RLS), cửa đăng nhập `/giao-vien`, màn quản lý giáo viên, menu theo vai trò; tăng tốc (getClaims, vùng sin1, khung tải, thanh tiến trình); chạy code Python trên trình duyệt kiểu W3Schools (Pyodide); 3 SVG mockup mới; cập nhật README/docs.
- 07/11 chat 3 (bổ sung): trang `/giao-vien` dùng logo robot tròn + hình `robot-clipboard-gv.png` (robot cầm bảng kẹp, đã tách nền) trên quầng sáng xanh; bỏ `school-illustration.png` (quá nhỏ, bị cắt).
- 12/11 chat 4: sửa chữ tràn toàn bộ giao diện (mục 7b) trên bản GitHub `Techkids-lms-main`; nhận file PPCT `Phân phối chương trình Python.xlsx` để làm tiếp 8.4.
- 12/11 chat 4 (tiếp): mở buổi bằng nút gạt + chế độ tự mở theo lịch; bài tập nhiều tab + chấm ✓/✗; nhập PPCT thật (đoán cột theo dữ liệu, đánh số lại, nút Làm Quiz, tự tạo bài tập); tách nền + WebP toàn bộ hình; nút Đăng nhập GV/HS; nộp bài bỏ ảnh, thêm dán link; giảm truy vấn, giữ web thức, sao lưu Excel. SQL mới: `006_mo_buoi_nhieu_bai.sql`.
- 12/11 chat 4: thầy chạy 006 + `npm run build` thành công lần đầu.
- 12/11 chat 4: Tổng quan GV gọn lại theo cách A (công tắc mở buổi nằm trong thẻ lớp, nút ⚙). PPCT thật CHƯA nhập vào web (lớp TK1/TK2 đang dùng chương trình mẫu).
