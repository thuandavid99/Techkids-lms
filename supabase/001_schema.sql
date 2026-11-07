-- =====================================================================
-- 001_schema.sql — TẠO BẢNG, RÀNG BUỘC, CHỈ MỤC cho Python LMS
-- Chạy trong Supabase → SQL Editor → New query → dán toàn bộ → Run.
-- An toàn khi chạy lại (dùng IF NOT EXISTS).
-- Quy ước: tên bảng/cột snake_case không dấu theo mục 11.1 của spec.
-- Thời gian lưu kiểu timestamptz (UTC); giao diện hiển thị giờ Việt Nam.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------- LỚP HỌC ----------
create table if not exists public.classes (
  id          uuid primary key default gen_random_uuid(),
  ten_lop     text not null,
  nam_hoc     text not null default '2026-2027',
  archived    boolean not null default false,
  deleted_at  timestamptz,
  tao_luc     timestamptz not null default now()
);

-- ---------- HỒ SƠ NGƯỜI DÙNG (gắn 1-1 với auth.users) ----------
create table if not exists public.profiles (
  id                    uuid primary key references auth.users(id) on delete cascade,
  ma_hs                 text not null unique,           -- mã đăng nhập (HS001 / tên đăng nhập GV)
  ho_ten                text not null,
  vai_tro               text not null default 'hoc_sinh'
                        check (vai_tro in ('hoc_sinh','giao_vien','tro_giang')),
  class_id              uuid references public.classes(id) on delete set null, -- lớp hiện tại
  must_change_password  boolean not null default true,  -- bắt đổi mật khẩu (HS chỉ tự đổi 1 lần)
  dang_hoc              boolean not null default true,  -- false = nghỉ học
  avatar                text not null default 'default', -- tên avatar mẫu
  deleted_at            timestamptz,
  tao_luc               timestamptz not null default now()
);
create index if not exists profiles_class_idx on public.profiles(class_id);

-- Lịch sử học sinh theo lớp (chuyển lớp / sang năm mới không mất dữ liệu)
create table if not exists public.enrollments (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references public.profiles(id) on delete cascade,
  class_id    uuid not null references public.classes(id) on delete cascade,
  nam_hoc     text not null,
  tu_ngay     date not null default current_date,
  den_ngay    date
);
create index if not exists enrollments_student_idx on public.enrollments(student_id);

-- Giáo viên phụ trách lớp (chuẩn bị cho trợ giảng; MVP: 1 giáo viên gán mọi lớp)
create table if not exists public.class_teachers (
  class_id    uuid not null references public.classes(id) on delete cascade,
  teacher_id  uuid not null references public.profiles(id) on delete cascade,
  quyen       text not null default 'chinh' check (quyen in ('chinh','tro_giang')),
  primary key (class_id, teacher_id)
);

-- ---------- CHƯƠNG TRÌNH (PPCT) ----------
create table if not exists public.curricula (
  id          uuid primary key default gen_random_uuid(),
  ten         text not null,
  mo_ta       text,
  nam_hoc     text,
  archived    boolean not null default false,
  deleted_at  timestamptz,
  tao_luc     timestamptz not null default now()
);

-- thu_tu: khóa sắp xếp dạng chuỗi (fractional index) — chèn giữa không phải đánh lại.
-- COLLATE "C" để so sánh theo từng byte (đúng thứ tự khóa).
create table if not exists public.modules (
  id             uuid primary key default gen_random_uuid(),
  curriculum_id  uuid not null references public.curricula(id) on delete cascade,
  ten            text not null,
  mo_ta          text,
  thu_tu         text collate "C" not null,
  deleted_at     timestamptz
);
create index if not exists modules_cur_idx on public.modules(curriculum_id, thu_tu);

create table if not exists public.topics (
  id          uuid primary key default gen_random_uuid(),
  module_id   uuid not null references public.modules(id) on delete cascade,
  ten         text not null,
  thu_tu      text collate "C" not null,
  deleted_at  timestamptz
);
create index if not exists topics_mod_idx on public.topics(module_id);

-- Loại buổi (giáo viên chỉnh trong Cài đặt)
create table if not exists public.lesson_types (
  id                   uuid primary key default gen_random_uuid(),
  ten                  text not null,
  mau                  text not null default 'blue',   -- blue/orange/purple/green/red/gray/teal
  icon                 text not null default 'book',   -- tên icon (lucide)
  co_bai_nop_mac_dinh  boolean not null default false,
  tinh_diem            boolean not null default false,
  noi_bat              boolean not null default false, -- dòng nền cam nổi bật
  tu_khoa              text,                           -- từ khóa nhận diện khi nhập Excel (vd "kiểm tra")
  thu_tu               int not null default 0,
  deleted_at           timestamptz
);

-- Buổi học
create table if not exists public.lessons (
  id                   uuid primary key default gen_random_uuid(),
  curriculum_id        uuid not null references public.curricula(id) on delete cascade,
  module_id            uuid references public.modules(id) on delete set null,
  topic_id             uuid references public.topics(id) on delete set null,
  thu_tu               text collate "C" not null,   -- hệ thống tự quản
  nhan_buoi            text not null default '',    -- giáo viên gõ: "7", "10–11"
  tieu_de              text not null,
  tom_tat              text,
  loai_id              uuid references public.lesson_types(id) on delete set null,
  noi_dung_kien_thuc   text,                        -- Markdown
  ban_nhap             boolean not null default false, -- "Lưu nháp": học sinh chưa thấy
  class_id             uuid references public.classes(id) on delete cascade, -- null = dùng chung
  ghi_de_cua           uuid references public.lessons(id) on delete cascade, -- bản ghi đè riêng lớp
  deleted_at           timestamptz,
  tao_luc              timestamptz not null default now(),
  constraint lessons_override_needs_class check (ghi_de_cua is null or class_id is not null)
);
create index if not exists lessons_cur_idx on public.lessons(curriculum_id, thu_tu);
create index if not exists lessons_override_idx on public.lessons(ghi_de_cua, class_id);
-- Mỗi lớp chỉ có tối đa 1 bản ghi đè cho 1 buổi gốc
create unique index if not exists lessons_one_override
  on public.lessons(ghi_de_cua, class_id) where ghi_de_cua is not null and deleted_at is null;

-- Chương trình áp dụng cho lớp (mỗi lớp 1 chương trình)
create table if not exists public.class_curriculum (
  class_id            uuid primary key references public.classes(id) on delete cascade,
  curriculum_id       uuid not null references public.curricula(id) on delete cascade,
  ngay_bat_dau        date,
  cac_thu_trong_tuan  int[] not null default '{}'   -- 1=Thứ 2 ... 7=Chủ nhật (ISO)
);

-- Tình trạng buổi theo lớp (luôn trỏ về buổi GỐC)
create table if not exists public.class_lessons (
  class_id   uuid not null references public.classes(id) on delete cascade,
  lesson_id  uuid not null references public.lessons(id) on delete cascade,
  ngay_hoc   date,
  hien_thi   boolean not null default true,
  ngay_mo    timestamptz,          -- hẹn giờ mở (null = mở ngay)
  da_day     boolean not null default false,
  ghi_chu    text,
  deleted_at timestamptz,
  primary key (class_id, lesson_id)
);

-- ---------- TÀI LIỆU ----------
create table if not exists public.material_categories (
  id       uuid primary key default gen_random_uuid(),
  ten      text not null,
  thu_tu   int not null default 0,
  deleted_at timestamptz
);

create table if not exists public.materials (
  id            uuid primary key default gen_random_uuid(),
  lesson_id     uuid references public.lessons(id) on delete cascade, -- null = kho chung
  loai          uuid references public.material_categories(id) on delete set null,
  tieu_de       text not null,
  nguon         text not null check (nguon in ('file','link')),
  url           text,                -- khi nguon = link
  file_path     text,                -- khi nguon = file (tên an toàn trong bucket materials)
  ten_goc       text,                -- tên gốc hiển thị
  kich_thuoc    bigint,
  mime          text,
  cho_phep_tai  boolean not null default true,
  hien_thi      boolean not null default true,
  thu_tu        text collate "C" not null default 'a0',
  deleted_at    timestamptz,
  tao_luc       timestamptz not null default now(),
  constraint materials_source check (
    (nguon = 'link' and url is not null) or (nguon = 'file' and file_path is not null))
);
create index if not exists materials_lesson_idx on public.materials(lesson_id);

-- Lớp nào được xem tài liệu. KHÔNG có dòng nào = mọi lớp đang học buổi đó / mọi lớp (kho chung).
create table if not exists public.material_classes (
  material_id uuid not null references public.materials(id) on delete cascade,
  class_id    uuid not null references public.classes(id) on delete cascade,
  primary key (material_id, class_id)
);

-- ---------- BÀI TẬP ----------
create table if not exists public.assignments (
  id           uuid primary key default gen_random_uuid(),
  lesson_id    uuid not null references public.lessons(id) on delete cascade, -- buổi GỐC
  ma           text not null default '',     -- "7.1"
  tieu_de      text not null,
  de_bai       text,                         -- Markdown
  diem_toi_da  numeric(5,2) not null default 10 check (diem_toi_da > 0),
  loai_nop     text not null default 'code' check (loai_nop in ('code','file','ca_hai','ngoai_he_thong')),
  cho_nop_tre  boolean not null default true,   -- false = khóa nộp sau hạn
  khoa_nop     boolean not null default false,  -- thầy khóa nộp thủ công
  tinh_diem    boolean not null default true,
  bat_buoc     boolean not null default true,
  he_so        numeric(4,2) not null default 1 check (he_so > 0),
  hoc_ky       int not null default 1 check (hoc_ky in (1,2)),
  hien_thi     boolean not null default true,
  thu_tu       text collate "C" not null default 'a0',
  class_id     uuid references public.classes(id) on delete cascade,
  ghi_de_cua   uuid references public.assignments(id) on delete cascade,
  deleted_at   timestamptz,
  tao_luc      timestamptz not null default now(),
  constraint assignments_override_needs_class check (ghi_de_cua is null or class_id is not null)
);
create index if not exists assignments_lesson_idx on public.assignments(lesson_id);
create unique index if not exists assignments_one_override
  on public.assignments(ghi_de_cua, class_id) where ghi_de_cua is not null and deleted_at is null;

create table if not exists public.assignment_files (
  id            uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  file_path     text not null,
  ten_goc       text not null,
  kich_thuoc    bigint,
  mime          text
);

-- Hạn nộp theo từng lớp (luôn theo bài tập GỐC)
create table if not exists public.assignment_deadlines (
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  class_id      uuid not null references public.classes(id) on delete cascade,
  han_nop       timestamptz,
  primary key (assignment_id, class_id)
);

-- Gia hạn riêng / miễn nộp cho từng học sinh
create table if not exists public.student_overrides (
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id    uuid not null references public.profiles(id) on delete cascade,
  han_nop_rieng timestamptz,
  mien_nop      boolean not null default false,
  ly_do         text,
  primary key (assignment_id, student_id)
);

-- ---------- BÀI NỘP (chỉ giữ bản mới nhất) ----------
create table if not exists public.submissions (
  id                 uuid primary key default gen_random_uuid(),
  assignment_id      uuid not null references public.assignments(id) on delete restrict,
  student_id         uuid not null references public.profiles(id) on delete cascade,
  so_lan_nop         int not null default 0,
  file_path          text,
  ten_goc            text,
  kich_thuoc         bigint,
  mime               text,
  code_text          text,
  nop_luc_dau        timestamptz,    -- giờ nộp LẦN ĐẦU (xét Đúng hạn/Trễ)
  nop_luc_moi_nhat   timestamptz,    -- giờ nộp bản hiện tại
  nguoi_nop          text not null default 'hs' check (nguoi_nop in ('hs','giao_vien_nop_ho')),
  trang_thai         text not null default 'da_nop'
                     check (trang_thai in ('da_nop','da_cham','can_nop_lai','nop_ngoai_he_thong')),
  nop_tre            boolean,        -- ghi lúc nộp lần đầu (tham khảo); nhãn chuẩn tính lúc truy vấn
  han_nop_lai        timestamptz,    -- khi thầy bấm "Cần nộp lại"
  diem               numeric(5,2),
  nhan_xet           text,
  cham_luc           timestamptz,
  constraint submissions_unique unique (assignment_id, student_id)
);
create index if not exists submissions_status_idx on public.submissions(trang_thai);
create index if not exists submissions_student_idx on public.submissions(student_id);

create table if not exists public.drafts (
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id    uuid not null references public.profiles(id) on delete cascade,
  code_text     text not null default '',
  saved_at      timestamptz not null default now(),
  primary key (assignment_id, student_id)
);

-- "Em chưa làm được"
create table if not exists public.student_flags (
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id    uuid not null references public.profiles(id) on delete cascade,
  chua_lam_duoc boolean not null default false,
  ghi_chu       text check (ghi_chu is null or char_length(ghi_chu) <= 200),
  danh_dau_luc  timestamptz,
  da_ho_tro     boolean not null default false,
  ho_tro_luc    timestamptz,
  primary key (assignment_id, student_id)
);

-- ---------- THÔNG BÁO ----------
create table if not exists public.announcements (
  id         uuid primary key default gen_random_uuid(),
  class_id   uuid not null references public.classes(id) on delete cascade,
  noi_dung   text not null,
  tao_luc    timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.notifications (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references public.profiles(id) on delete cascade,
  loai      text not null,      -- bai_moi / sap_han / da_cham / can_nop_lai / lop / chua_lam_duoc / reset_mk
  noi_dung  text not null,
  lien_ket  text,               -- đường dẫn trong web
  khoa_gop  text,               -- gộp thông báo trùng (vd "flag:<hs>:<buoi>")
  da_doc    boolean not null default false,
  tao_luc   timestamptz not null default now()
);
create unique index if not exists notifications_gop on public.notifications(user_id, khoa_gop) where khoa_gop is not null;
create index if not exists notifications_user_idx on public.notifications(user_id, tao_luc desc);

create table if not exists public.password_requests (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references public.profiles(id) on delete cascade,
  tao_luc     timestamptz not null default now(),
  trang_thai  text not null default 'cho' check (trang_thai in ('cho','da_xu_ly'))
);

-- ---------- NHẮC PHỤ HUYNH (không lưu SĐT) ----------
create table if not exists public.parent_reminders (
  id              uuid primary key default gen_random_uuid(),
  student_id      uuid not null references public.profiles(id) on delete cascade,
  assignment_ids  uuid[] not null default '{}',
  noi_dung        text not null,
  kenh            text not null default 'zalo',
  nhac_luc        timestamptz not null default now(),
  ghi_chu         text
);

create table if not exists public.message_templates (
  id        uuid primary key default gen_random_uuid(),
  ten       text not null,
  noi_dung  text not null,   -- biến: {ten_hs} {danh_sach_bai} {han_nop} {lop}
  mac_dinh  boolean not null default false
);

-- Nhận xét mẫu khi chấm
create table if not exists public.comment_templates (
  id        uuid primary key default gen_random_uuid(),
  noi_dung  text not null,
  thu_tu    int not null default 0
);

create table if not exists public.teacher_notes (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references public.profiles(id) on delete cascade,
  noi_dung    text not null,
  tao_luc     timestamptz not null default now()
);

create table if not exists public.audit_log (
  id            bigint generated always as identity primary key,
  user_id       uuid,
  hanh_dong     text not null,     -- sua_diem / sua_han / xoa / an / khoi_phuc / xoa_vinh_vien / reset_mk ...
  doi_tuong     text not null,     -- tên bảng
  doi_tuong_id  text,
  truoc         jsonb,
  sau           jsonb,
  luc           timestamptz not null default now()
);
create index if not exists audit_luc_idx on public.audit_log(luc desc);

-- Cài đặt chung (làm tròn điểm, quy tắc nộp trễ mặc định...)
create table if not exists public.app_settings (
  key    text primary key,
  value  jsonb not null
);
